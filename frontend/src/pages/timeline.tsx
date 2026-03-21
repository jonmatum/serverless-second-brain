import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { GraphNode } from "@/lib/types";
import { TypeBadge, StatusBadge } from "@/components/badges";
import { Filters } from "@/components/filters";
import { Card } from "@/components/ui/card";
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
          <h1 className="text-2xl font-bold">{t("timeline.title", locale)}</h1>
          <span className="text-sm text-muted-foreground">{sorted.length}</span>
        </div>
        <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />
      </div>

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t("listing.empty", locale)}</p>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {sorted.map((n) => (
              <Link key={n.id} to={`/node?id=${n.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-colors first:rounded-t-lg last:rounded-b-lg">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[n.node_type] }} />
                <span className="truncate flex-1">{n.title}</span>
                <span className="hidden sm:inline-flex"><StatusBadge status={n.status} /></span>
                <span className="text-xs text-muted-foreground shrink-0">{n.edge_count}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
