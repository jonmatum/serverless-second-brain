"use client";

interface Props {
  type: string;
  status: string;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export function Filters({ type, status, onTypeChange, onStatusChange }: Props) {
  const sel =
    "rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500";
  return (
    <div className="flex flex-wrap gap-3">
      <select value={type} onChange={(e) => onTypeChange(e.target.value)} className={sel} aria-label="Filtrar por tipo">
        <option value="">Todos los tipos</option>
        <option value="concept">Concepto</option>
        <option value="note">Nota</option>
        <option value="experiment">Experimento</option>
        <option value="essay">Ensayo</option>
      </select>
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={sel} aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        <option value="seed">🌱 Semilla</option>
        <option value="growing">🌿 Creciendo</option>
        <option value="evergreen">🌲 Perenne</option>
      </select>
    </div>
  );
}
