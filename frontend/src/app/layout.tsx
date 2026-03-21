import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Brain",
  description:
    "Personal knowledge graph with search, visualization, and AI agent integration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <nav className="border-b border-zinc-800 px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <a href="/" className="text-lg font-semibold tracking-tight">
              ssb
            </a>
            <div className="flex gap-6 text-sm text-zinc-400">
              <a href="/graph" className="hover:text-zinc-100">
                Grafo
              </a>
              <a href="/search" className="hover:text-zinc-100">
                Búsqueda
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-500">
          Serverless Second Brain · Powered by AWS
        </footer>
      </body>
    </html>
  );
}
