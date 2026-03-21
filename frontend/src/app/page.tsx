import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Second Brain</h1>
        <p className="max-w-xl text-lg text-zinc-400">
          Grafo de conocimiento personal — serverless, bilingüe, con búsqueda
          semántica y puerta para agentes de IA.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card href="/dashboard" title="Dashboard" desc="Estadísticas y salud del grafo" />
        <Card href="/graph" title="Grafo" desc="Visualización interactiva D3" />
        <Card href="/search" title="Búsqueda" desc="Keyword + semántica con Bedrock" />
        <Card href="/concepts" title="Conceptos" desc="Todos los conceptos del grafo" />
        <Card href="/notes" title="Notas" desc="Notas y apuntes" />
        <Card href="/experiments" title="Experimentos" desc="Proyectos y pruebas" />
        <Card href="/essays" title="Ensayos" desc="Ensayos publicados" />
        <Card href="/timeline" title="Línea de tiempo" desc="Vista cronológica" />
      </div>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-800 p-5 transition hover:border-zinc-600 hover:bg-zinc-900/50"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{desc}</p>
    </Link>
  );
}
