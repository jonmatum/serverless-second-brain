"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { GraphNode } from "@/lib/types";
import { NodeCard } from "@/components/node-card";
import { TYPE_LABELS } from "@/lib/constants";

interface Props {
  nodeType: string;
}

export function ListingPage({ nodeType }: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"edges" | "title">("edges");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.graph({ type: nodeType, status: status || undefined }).then((d) => {
      setNodes(d.nodes);
      setLoading(false);
    });
  }, [nodeType, status]);

  const sorted = [...nodes].sort((a, b) =>
    sort === "edges" ? b.edge_count - a.edge_count : a.title.localeCompare(b.title),
  );

  const label = TYPE_LABELS[nodeType] ?? nodeType;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{label}s</h1>
        <div className="flex gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-300"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos</option>
            <option value="seed">🌱 Semilla</option>
            <option value="growing">🌿 Creciendo</option>
            <option value="evergreen">🌲 Perenne</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "edges" | "title")}
            className="rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-300"
            aria-label="Ordenar por"
          >
            <option value="edges">Más conectados</option>
            <option value="title">Alfabético</option>
          </select>
          <span className="self-center text-sm text-zinc-500">{sorted.length}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500">Cargando…</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((n) => (
            <NodeCard
              key={n.id}
              id={n.id}
              title={n.title}
              node_type={n.node_type}
              status={n.status}
              tags={n.tags}
              extra={<span className="ml-auto text-xs text-zinc-500">{n.edge_count} aristas</span>}
            />
          ))}
        </div>
      )}
    </div>
  );
}
