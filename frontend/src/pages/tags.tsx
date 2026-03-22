import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Tag, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { GraphNode } from "@/lib/types";
import { NodeCard } from "@/components/node-card";
import { CardListSkeleton } from "@/components/skeletons";
import { t, localized } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useAuth } from "@/lib/auth";

export default function TagsPage() {
  const { locale } = usePrefs();
  const { token, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const activeTag = params.get("tag");
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    api.graph({}, token).then((d) => { setNodes(d.nodes); setLoading(false); }).catch(() => setLoading(false));
  }, [token, authLoading]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of nodes) for (const tag of n.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const filtered = useMemo(() => {
    if (!activeTag) return [];
    return nodes.filter((n) => n.tags?.includes(activeTag))
      .sort((a, b) => localized(a, "title", locale).localeCompare(localized(b, "title", locale), locale));
  }, [nodes, activeTag, locale]);

  if (loading) return <CardListSkeleton />;

  // Tag detail view
  if (activeTag) {
    return (
      <div className="space-y-5">
        <div>
          <Link to="/tags" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]">
            <ArrowLeft className="h-4 w-4" />
            {t("tags.all", locale)}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">#{activeTag}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{t("tags.count", locale, { count: filtered.length })}</p>
        </div>
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-[var(--color-muted)]">{t("listing.empty", locale)}</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((n) => (
              <li key={n.id}>
                <NodeCard id={n.id} title={localized(n, "title", locale)} summary={localized(n, "summary", locale) || undefined} node_type={n.node_type} status={n.status} tags={n.tags} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Tag index
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("tags.title", locale)}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t("tags.desc", locale)}</p>
      </div>
      {tagCounts.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-muted)]">{t("listing.empty", locale)}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tagCounts.map(([tag, count]) => (
            <Link key={tag} to={`/tags?tag=${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--color-muted)]">
              <Tag className="h-3 w-3 text-[var(--color-muted)]" />
              <span>{tag}</span>
              <span className="text-xs text-[var(--color-muted)]">{count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
