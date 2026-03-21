import { t, typeLabel, statusLabel } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

const TYPES = ["concept", "note", "experiment", "essay"];
const STATUSES = ["seed", "growing", "evergreen"];

interface Props {
  type: string;
  status: string;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export function Filters({ type, status, onTypeChange, onStatusChange }: Props) {
  const { locale } = usePrefs();
  return (
    <div className="flex flex-wrap gap-3">
      <select value={type || "_all"} onChange={(e) => onTypeChange(e.target.value === "_all" ? "" : e.target.value)} aria-label={t("filter.type", locale)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none sm:w-auto">
        <option value="_all">{t("filter.all_types", locale)}</option>
        {TYPES.map((tp) => <option key={tp} value={tp}>{typeLabel(tp, locale)}</option>)}
      </select>
      <select value={status || "_all"} onChange={(e) => onStatusChange(e.target.value === "_all" ? "" : e.target.value)} aria-label={t("filter.status", locale)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none sm:w-auto">
        <option value="_all">{t("filter.all_statuses", locale)}</option>
        {STATUSES.map((st) => <option key={st} value={st}>{statusLabel(st, locale)}</option>)}
      </select>
    </div>
  );
}
