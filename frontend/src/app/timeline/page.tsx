"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { GraphNode } from "@/lib/types";
import { TypeBadge, StatusBadge } from "@/components/badges";
import { Filters } from "@/components/filters";

export default function TimelinePage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.graph({ type: type || undefined, status: status || undefined }).then((d) => setNodes(d.nodes));
  }, [type, status]);

  // Group by month — use id as proxy since graph endpoint doesn't return created_at
  // For now, show a flat sorted list; full timeline needs created_at from node detail
  const sorted = [...nodes].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Línea de tiempo</h1>
        <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />
      </div>
      <p className="text-sm text-zinc-500">{sorted.length} nodos</p>
      <div className="space-y-1">
        {sorted.map((n) => (
          <Link
            key={n.id}
            href={`/node?id=${n.id}`}
            className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <span>{n.title}</span>
              <TypeBadge type={n.node_type} />
            </div>
            <StatusBadge status={n.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
