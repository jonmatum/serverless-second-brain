import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { GraphNode } from "@/lib/types";
import { NodeCard } from "@/components/node-card";
import { t, typeLabel, statusLabel } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

const STATUSES = ["seed", "growing", "evergreen"];

export function ListingPage({ nodeType }: { nodeType: string }) {
  const { locale } = usePrefs();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"edges" | "title">("edges");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.graph({ type: nodeType, status: status || undefined }).then((d) => {
      setNodes(d.nodes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [nodeType, status]);

  const sorted = [...nodes].sort((a, b) =>
    sort === "edges" ? b.edge_count - a.edge_count : a.title.localeCompare(b.title),
  );

  return (
    <div className="space-y-5">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">{typeLabel(nodeType, locale)}s</h1>
          {!loading && <span className="text-sm text-[var(--color-muted)]">{sorted.length}</span>}
        </div>
        <div className="flex items-center gap-2">
          <select value={status || "_all"} onChange={(e) => setStatus(e.target.value === "_all" ? "" : e.target.value)} aria-label={t("filter.status", locale)}
            className="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none">
            <option value="_all">{t("filter.all_statuses", locale)}</option>
            {STATUSES.map((st) => <option key={st} value={st}>{statusLabel(st, locale)}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as "edges" | "title")} aria-label={t("listing.sort", locale)}
            className="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none">
            <option value="edges">{t("listing.sort.edges", locale)}</option>
            <option value="title">{t("listing.sort.alpha", locale)}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-[var(--color-muted)]">{t("common.loading", locale)}</p>
      ) : sorted.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-muted)]">{t("listing.empty", locale)}</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((n) => (
            <NodeCard key={n.id} id={n.id} title={n.title} node_type={n.node_type} status={n.status} tags={n.tags}
              extra={<span className="ml-auto text-xs text-[var(--color-muted)]">{n.edge_count}</span>} />
          ))}
        </div>
      )}
    </div>
  );
}
