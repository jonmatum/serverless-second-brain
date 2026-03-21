export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Second Brain</h1>
        <p className="max-w-2xl text-zinc-400">
          Grafo de conocimiento personal con búsqueda híbrida, visualización
          interactiva y endpoints para agentes de IA. Desplegado completamente
          en AWS con costo cero en reposo.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <a
          href="/graph"
          className="rounded-lg border border-zinc-800 p-6 transition hover:border-zinc-600"
        >
          <h2 className="text-lg font-semibold">Grafo de conocimiento</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Visualización interactiva de nodos y conexiones.
          </p>
        </a>
        <a
          href="/search"
          className="rounded-lg border border-zinc-800 p-6 transition hover:border-zinc-600"
        >
          <h2 className="text-lg font-semibold">Búsqueda</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Búsqueda híbrida por palabras clave y semántica.
          </p>
        </a>
      </section>

      {apiUrl && (
        <p className="text-xs text-zinc-600">API: {apiUrl}</p>
      )}
    </div>
  );
}
