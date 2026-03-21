import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { PrefsProvider, usePrefs } from "@/lib/prefs";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PrefsMenu } from "@/components/prefs-menu";
import { t, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV_KEYS: { href: string; key: DictKey }[] = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/graph", key: "nav.graph" },
  { href: "/search", key: "nav.search" },
  { href: "/concepts", key: "nav.concepts" },
  { href: "/timeline", key: "nav.timeline" },
  { href: "/capture", key: "nav.capture" },
];

function AuthButton() {
  const { user, loading, login, logout } = useAuth();
  const { locale } = usePrefs();
  if (loading) return null;
  if (user) {
    return (
      <button onClick={logout} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" title={user.email}>
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">{t("auth.logout", locale)}</span>
      </button>
    );
  }
  return (
    <button onClick={login} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">{t("auth.login", locale)}</span>
    </button>
  );
}

function ShellInner() {
  const { layout, locale } = usePrefs();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const maxW = layout === "boxed" ? "max-w-5xl" : "";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 sm:px-6 ${maxW}`}>
          <Link to="/" className="text-base font-semibold tracking-tight" onClick={() => setOpen(false)}>
            ssb
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_KEYS.map((n) => (
              <Link
                key={n.href}
                to={n.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive(n.href)
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {t(n.key, locale)}
              </Link>
            ))}
            <div className="ml-2 flex items-center gap-1 border-l border-border/50 pl-3">
              <AuthButton />
              <PrefsMenu />
            </div>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 md:hidden">
            <AuthButton />
            <PrefsMenu />
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-border/50 px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-0.5">
              {NAV_KEYS.map((n) => (
                <Link
                  key={n.href}
                  to={n.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(n.href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t(n.key, locale)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-10 ${maxW}`}>
        <Outlet />
      </main>

      <footer className="border-t border-border/50 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        {t("footer", locale)}
      </footer>
    </div>
  );
}

export default function Shell() {
  return (
    <PrefsProvider>
      <AuthProvider>
        <ShellInner />
      </AuthProvider>
    </PrefsProvider>
  );
}
