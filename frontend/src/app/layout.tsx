import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Second Brain",
  description: "Personal knowledge graph with search, visualization, and AI agent integration.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem("ssb-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}` }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
