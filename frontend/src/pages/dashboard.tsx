import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { GraphResponse } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { TYPE_COLORS } from "@/lib/constants";
import { t, typeLabel, statusLabel } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

export default function Dashboard() {
  const { locale } = usePrefs();
  const [data, setData] = useState<GraphResponse | null>(null);

  useEffect(() => { api.graph().then(setData).catch(() => {}); }, []);

  if (!data) return <p className="py-12 text-center text-muted-foreground">{t("common.loading", locale)}</p>;

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const n of data.nodes) {
    byType[n.node_type] = (byType[n.node_type] ?? 0) + 1;
    byStatus[n.status] = (byStatus[n.status] ?? 0) + 1;
  }
  const orphans = data.nodes.filter((n) => n.edge_count < 2).length;
  const topConnected = [...data.nodes].sort((a, b) => b.edge_count - a.edge_count).slice(0, 10);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t("dashboard.title", locale)}</h1>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <StatCard label={t("dashboard.nodes", locale)} value={data.meta.node_count} />
        <StatCard label={t("dashboard.edges", locale)} value={data.meta.edge_count} />
        <StatCard label={t("dashboard.orphans", locale)} value={orphans} sub={t("dashboard.orphans.sub", locale)} />
        <StatCard label={t("dashboard.seeds", locale)} value={byStatus["seed"] ?? 0} sub={t("dashboard.seeds.sub", locale)} />
      </div>

      {/* By type + By status side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.by_type", locale)}</h2>
          <div className="grid gap-2 grid-cols-2">
            {Object.entries(byType).map(([tp, count]) => (
              <Link key={tp} to={`/${tp}s`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-3 p-3">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[tp] }} />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{typeLabel(tp, locale)}</p>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.by_status", locale)}</h2>
          <div className="grid gap-2 grid-cols-3">
            {Object.entries(byStatus).map(([st, count]) => (
              <Card key={st}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{statusLabel(st, locale)}</p>
                  <p className="text-xl font-bold mt-1">{count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Most connected */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.most_connected", locale)}</h2>
        <Card>
          <div className="divide-y divide-border">
            {topConnected.map((n, i) => (
              <Link key={n.id} to={`/node?id=${n.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-colors first:rounded-t-lg last:rounded-b-lg">
                <span className="w-5 text-xs text-muted-foreground text-right shrink-0">{i + 1}</span>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[n.node_type] }} />
                <span className="truncate flex-1">{n.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{n.edge_count}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
