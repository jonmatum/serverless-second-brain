export default function NotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-zinc-400">Página no encontrada.</p>
      <a href="/" className="text-sm text-zinc-400 underline hover:text-zinc-100">
        Volver al inicio
      </a>
    </div>
  );
}
