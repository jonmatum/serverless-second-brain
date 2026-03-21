import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { GraphNode } from "@/lib/types";
import { StatusBadge } from "@/components/badges";
import { Filters } from "@/components/filters";
import { TYPE_COLORS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

export default function Timeline() {
  const { locale } = usePrefs();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.graph({ type: type || undefined, status: status || undefined }).then((d) => setNodes(d.nodes)).catch(() => {});
  }, [type, status]);

  const sorted = [...nodes].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-5">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">{t("timeline.title", locale)}</h1>
          <span className="text-sm text-[var(--color-muted)]">{sorted.length}</span>
        </div>
        <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />
      </div>

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-muted)]">{t("listing.empty", locale)}</p>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)]">
          <div className="divide-y divide-[var(--color-border)]">
            {sorted.map((n) => (
              <Link key={n.id} to={`/node?id=${n.id}`} className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:text-[var(--color-accent)] first:rounded-t-xl last:rounded-b-xl">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[n.node_type] }} />
                <span className="truncate flex-1">{n.title}</span>
                <span className="hidden sm:inline-flex"><StatusBadge status={n.status} /></span>
                <span className="text-xs text-[var(--color-muted)] shrink-0">{n.edge_count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
