"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { NodeResponse } from "@/lib/types";
import { TypeBadge, StatusBadge, Tag } from "@/components/badges";

function NodeContent() {
  const params = useSearchParams();
  const slug = params.get("id") ?? "";
  const [data, setData] = useState<NodeResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    api.node(slug).then(setData).catch((e) => setError(e.message));
  }, [slug]);

  if (!slug) return <p className="text-zinc-500">No se especificó un nodo.</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!data) return <p className="text-zinc-500">Cargando…</p>;

  const { node, edges, related } = data;

  return (
    <article className="space-y-8">
      <div>
        <Link href="/graph" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Grafo
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{node.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <TypeBadge type={node.node_type} />
          <StatusBadge status={node.status} />
          <span className="text-xs text-zinc-500">
            {new Date(node.created_at).toLocaleDateString("es")}
          </span>
          {node.word_count_es && (
            <span className="text-xs text-zinc-500">{node.word_count_es} palabras</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="mb-1 text-sm font-medium text-zinc-400">Resumen (ES)</h2>
          <p className="text-zinc-200">{node.summary_es}</p>
        </div>
        <div>
          <h2 className="mb-1 text-sm font-medium text-zinc-400">Summary (EN)</h2>
          <p className="text-zinc-300">{node.summary_en}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {node.tags.map((t) => (
          <Tag key={t} tag={t} />
        ))}
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            Nodos relacionados ({edges.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/node?id=${r.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 transition hover:border-zinc-600"
              >
                <span>{r.title}</span>
                <TypeBadge type={r.node_type} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function NodePage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
      <NodeContent />
    </Suspense>
  );
}
