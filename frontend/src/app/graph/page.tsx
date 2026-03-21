"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { GraphResponse } from "@/lib/types";
import { ForceGraph } from "@/components/force-graph";
import { Filters } from "@/components/filters";
import { TYPE_COLORS, TYPE_LABELS } from "@/lib/constants";

export default function GraphPage() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.graph({ type: type || undefined, status: status || undefined })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [type, status]);

  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!data) return <p className="text-zinc-500">Cargando grafo…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Grafo de conocimiento</h1>
        <div className="flex items-center gap-4">
          <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />
          <span className="text-sm text-zinc-500">
            {data.meta.node_count} nodos · {data.meta.edge_count} aristas
          </span>
        </div>
      </div>

      <ForceGraph nodes={data.nodes} edges={data.edges} />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
        {Object.entries(TYPE_COLORS).map(([t, c]) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
            {TYPE_LABELS[t]}
          </span>
        ))}
      </div>
    </div>
  );
}
