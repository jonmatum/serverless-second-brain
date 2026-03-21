import { TYPE_COLORS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";

export function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] ?? "#71717a";
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="text-xs text-zinc-400">
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Tag({ tag }: { tag: string }) {
  return (
    <span className="inline-block rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
      {tag}
    </span>
  );
}
