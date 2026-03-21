import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { GraphResponse } from "@/lib/types";
import { ForceGraph } from "@/components/force-graph";
import { Filters } from "@/components/filters";
import { t } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

export default function Graph() {
  const { locale } = usePrefs();
  const [data, setData] = useState<GraphResponse | null>(null);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.graph({ type: type || undefined, status: status || undefined }).then(setData).catch(() => {});
  }, [type, status]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("graph.title", locale)}</h1>
          {data && <p className="text-sm text-muted-foreground">{t("graph.nodes_edges", locale, { nodes: data.meta.node_count, edges: data.meta.edge_count })}</p>}
        </div>
        <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />
      </div>
      {data ? <ForceGraph nodes={data.nodes} edges={data.edges} /> : <p className="text-muted-foreground">{t("graph.loading", locale)}</p>}
    </div>
  );
}
