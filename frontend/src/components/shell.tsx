import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { PrefsProvider, usePrefs } from "@/lib/prefs";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PrefsMenu } from "@/components/prefs-menu";
import { t, type DictKey } from "@/lib/i18n";
import { Separator } from "@/components/ui/separator";

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
  const maxW = layout === "boxed" ? "max-w-6xl" : "";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 sm:px-6 ${maxW}`}>
          <Link to="/" className="text-lg font-semibold tracking-tight" onClick={() => setOpen(false)}>ssb</Link>
          <div className="hidden items-center gap-5 md:flex">
            <div className="flex gap-4 text-sm text-muted-foreground">
              {NAV_KEYS.map((n) => (
                <Link key={n.href} to={n.href} className="hover:text-foreground transition-colors">{t(n.key, locale)}</Link>
              ))}
            </div>
            <AuthButton />
            <PrefsMenu />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <AuthButton />
            <PrefsMenu />
            <button onClick={() => setOpen(!open)} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-border px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_KEYS.map((n) => (
                <Link key={n.href} to={n.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  {t(n.key, locale)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main className={`mx-auto px-4 py-6 sm:px-6 sm:py-10 ${maxW}`}><Outlet /></main>
      <Separator />
      <footer className="px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">{t("footer", locale)}</footer>
    </>
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
