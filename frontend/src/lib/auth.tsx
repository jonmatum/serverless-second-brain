import { createContext, useContext, useCallback, useEffect, useState, useRef, type ReactNode } from "react";

interface AuthState {
  user: { email: string } | null;
  token: string | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN ?? "";
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID ?? "";

const Ctx = createContext<AuthState>({
  user: null, token: null, loading: true,
  login: () => {}, logout: () => {},
});

async function pkce() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  const verifier = btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}

function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}

function redirectUri() {
  return `${window.location.origin}/callback`;
}

async function exchangeToken(params: Record<string, string>) {
  const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!res.ok) return null;
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTokenRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const applyToken = useCallback((accessToken: string, refreshToken?: string) => {
    setToken(accessToken);
    if (refreshToken) refreshTokenRef.current = refreshToken;
    try {
      const claims = decodeJwt(accessToken);
      setUser({ email: (claims.email as string) ?? (claims.username as string) ?? "owner" });
    } catch { /* ignore */ }
  }, []);

  const scheduleRefresh = useCallback((accessToken: string) => {
    clearTimeout(timerRef.current);
    try {
      const claims = decodeJwt(accessToken);
      const ms = (claims.exp as number) * 1000 - Date.now() - 60_000;
      if (ms > 0 && refreshTokenRef.current) {
        const rt = refreshTokenRef.current;
        timerRef.current = setTimeout(async () => {
          const data = await exchangeToken({ grant_type: "refresh_token", client_id: CLIENT_ID, refresh_token: rt });
          if (data?.access_token) {
            applyToken(data.access_token);
            scheduleRefresh(data.access_token);
          } else {
            setUser(null);
            setToken(null);
          }
        }, ms);
      }
    } catch { /* ignore */ }
  }, [applyToken]);

  useEffect(() => {
    if (!CLIENT_ID || !COGNITO_DOMAIN) { setLoading(false); return; }
    const code = sessionStorage.getItem("ssb-auth-code");
    const verifier = sessionStorage.getItem("ssb-pkce-verifier");
    if (code && verifier) {
      sessionStorage.removeItem("ssb-auth-code");
      sessionStorage.removeItem("ssb-pkce-verifier");
      exchangeToken({
        grant_type: "authorization_code", client_id: CLIENT_ID,
        code, redirect_uri: redirectUri(), code_verifier: verifier,
      }).then((data) => {
        if (data?.access_token) {
          applyToken(data.access_token, data.refresh_token);
          scheduleRefresh(data.access_token);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [applyToken, scheduleRefresh]);

  const login = useCallback(async () => {
    if (!CLIENT_ID || !COGNITO_DOMAIN) return;
    const { verifier, challenge } = await pkce();
    sessionStorage.setItem("ssb-pkce-verifier", verifier);
    const params = new URLSearchParams({
      response_type: "code", client_id: CLIENT_ID,
      redirect_uri: redirectUri(),
      scope: "openid email profile ssb-api/read ssb-api/write",
      code_challenge_method: "S256", code_challenge: challenge,
    });
    window.location.href = `${COGNITO_DOMAIN}/login?${params}`;
  }, []);

  const logout = useCallback(() => {
    setUser(null); setToken(null);
    refreshTokenRef.current = null;
    clearTimeout(timerRef.current);
    if (COGNITO_DOMAIN && CLIENT_ID) {
      window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(window.location.origin)}`;
    }
  }, []);

  return <Ctx.Provider value={{ user, token, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
