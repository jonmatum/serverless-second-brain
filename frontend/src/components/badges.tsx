import { TYPE_COLORS } from "@/lib/constants";
import { typeLabel, statusLabel } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

export function TypeBadge({ type }: { type: string }) {
  const { locale } = usePrefs();
  const color = TYPE_COLORS[type] ?? "#71717a";
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={{ borderColor: color, color }}>
      {typeLabel(type, locale)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { locale } = usePrefs();
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
      {statusLabel(status, locale)}
    </span>
  );
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
      {tag}
    </span>
  );
}
