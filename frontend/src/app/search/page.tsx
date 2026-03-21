"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { SearchResponse } from "@/lib/types";
import { NodeCard } from "@/components/node-card";
import { Filters } from "@/components/filters";

const SUGGESTIONS = ["serverless", "lambda", "terraform", "knowledge graph", "bedrock", "mcp"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.search(q, { type: type || undefined, status: status || undefined, limit: 20 });
        setData(res);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    },
    [type, status],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Búsqueda</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); search(query); }}
        className="flex gap-3"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en el grafo de conocimiento…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
          aria-label="Consulta de búsqueda"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "…" : "Buscar"}
        </button>
      </form>

      <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />

      {error && <p className="text-red-400">{error}</p>}

      {data && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">
            {data.total} resultado{data.total !== 1 ? "s" : ""} en {data.took_ms}ms
          </p>
          {data.results.map((r) => (
            <NodeCard
              key={r.id}
              id={r.id}
              title={r.title}
              summary={r.summary_es}
              node_type={r.node_type}
              status={r.status}
              tags={r.tags}
              score={r.score}
            />
          ))}
          {data.total === 0 && (
            <p className="text-zinc-500">Sin resultados para &ldquo;{data.query}&rdquo;</p>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">Sugerencias:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); search(s); }}
                className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
