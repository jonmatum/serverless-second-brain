"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PrefsProvider, usePrefs } from "@/lib/prefs";
import { PrefsMenu } from "@/components/prefs-menu";
import { t, type DictKey } from "@/lib/i18n";
import { Separator } from "@/components/ui/separator";

const NAV_KEYS: { href: string; key: DictKey }[] = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/graph", key: "nav.graph" },
  { href: "/search", key: "nav.search" },
  { href: "/concepts", key: "nav.concepts" },
  { href: "/timeline", key: "nav.timeline" },
];

function ShellInner({ children }: { children: React.ReactNode }) {
  const { layout, locale } = usePrefs();
  const [open, setOpen] = useState(false);
  const maxW = layout === "boxed" ? "max-w-6xl" : "";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 sm:px-6 ${maxW}`}>
          <Link href="/" className="text-lg font-semibold tracking-tight" onClick={() => setOpen(false)}>
            ssb
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-5 md:flex">
            <div className="flex gap-4 text-sm text-muted-foreground">
              {NAV_KEYS.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-foreground transition-colors">
                  {t(n.key, locale)}
                </Link>
              ))}
            </div>
            <PrefsMenu />
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
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
          <div className="border-t border-border px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_KEYS.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {t(n.key, locale)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className={`mx-auto px-4 py-6 sm:px-6 sm:py-10 ${maxW}`}>{children}</main>

      <Separator />
      <footer className="px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        {t("footer", locale)}
      </footer>
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PrefsProvider>
      <ShellInner>{children}</ShellInner>
    </PrefsProvider>
  );
}
