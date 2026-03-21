"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { GraphResponse } from "@/lib/types";
import { TYPE_COLORS, TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";

export default function DashboardPage() {
  const [data, setData] = useState<GraphResponse | null>(null);

  useEffect(() => {
    api.graph().then(setData);
  }, []);

  if (!data) return <p className="text-zinc-500">Cargando…</p>;

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const recent = [...data.nodes]
    .sort((a, b) => b.edge_count - a.edge_count)
    .slice(0, 10);

  for (const n of data.nodes) {
    byType[n.node_type] = (byType[n.node_type] ?? 0) + 1;
    byStatus[n.status] = (byStatus[n.status] ?? 0) + 1;
  }

  const orphans = data.nodes.filter((n) => n.edge_count < 2).length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Nodos" value={data.meta.node_count} />
        <Stat label="Aristas" value={data.meta.edge_count} />
        <Stat label="Huérfanos" value={orphans} sub="< 2 aristas" />
        <Stat label="Semillas" value={byStatus["seed"] ?? 0} sub="pendientes de revisión" />
      </div>

      {/* By type */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Por tipo</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {Object.entries(byType).map(([t, count]) => (
            <Link
              key={t}
              href={`/${t}s`}
              className="rounded-lg border border-zinc-800 p-4 transition hover:border-zinc-600"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] }} />
                <span className="text-sm font-medium">{TYPE_LABELS[t] ?? t}</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{count}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* By status */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Por estado</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(byStatus).map(([s, count]) => (
            <div key={s} className="rounded-lg border border-zinc-800 p-4">
              <span className="text-sm">{STATUS_LABELS[s] ?? s}</span>
              <p className="mt-1 text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Most connected */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Más conectados</h2>
        <div className="space-y-1">
          {recent.map((n) => (
            <Link
              key={n.id}
              href={`/node?id=${n.id}`}
              className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-zinc-900"
            >
              <span>{n.title}</span>
              <span className="text-zinc-500">{n.edge_count} aristas</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
