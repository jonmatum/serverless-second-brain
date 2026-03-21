import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { SearchResponse } from "@/lib/types";
import { NodeCard } from "@/components/node-card";
import { Filters } from "@/components/filters";
import { Search } from "lucide-react";
import { t, localized } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

const SUGGESTIONS = ["serverless", "lambda", "terraform", "knowledge graph", "bedrock", "mcp"];

export default function SearchPage() {
  const { locale } = usePrefs();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError("");
    try {
      setData(await api.search(q, { type: type || undefined, status: status || undefined, limit: 20 }));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [type, status]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("search.title", locale)}</h1>

      <form onSubmit={(e) => { e.preventDefault(); search(query); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search.placeholder", locale)} aria-label={t("search.title", locale)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 pl-9 text-sm outline-none transition-colors focus:border-[var(--color-accent)]" />
        </div>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-[var(--color-fg)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-50">
          {loading ? "..." : t("search.button", locale)}
        </button>
      </form>

      <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {data ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">{t("search.results", locale, { count: data.total, s: data.total !== 1 ? "s" : "", ms: data.took_ms })}</p>
          {data.results.map((r) => (
            <NodeCard key={r.id} id={r.id} title={r.title} summary={localized(r, "summary", locale)} node_type={r.node_type} status={r.status} tags={r.tags} score={r.score} />
          ))}
          {data.total === 0 && (
            <p className="py-8 text-center text-[var(--color-muted)]">{t("search.no_results", locale, { q: data.query })}</p>
          )}
        </div>
      ) : !loading ? (
        <div className="space-y-3 py-4">
          <p className="text-sm text-[var(--color-muted)]">{t("search.suggestions", locale)}</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => { setQuery(s); search(s); }}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)]">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
