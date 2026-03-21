import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { NodeResponse } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { TypeBadge, StatusBadge, TagBadge } from "@/components/badges";
import { t, localized } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

export default function NodePage() {
  const { locale } = usePrefs();
  const [params] = useSearchParams();
  const slug = params.get("id") ?? "";
  const [data, setData] = useState<NodeResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    api.node(slug).then(setData).catch((e) => setError(e.message));
  }, [slug]);

  if (!slug) return <p className="text-muted-foreground">{t("node.empty", locale)}</p>;
  if (error) return <p className="text-destructive">{t("common.error", locale, { msg: error })}</p>;
  if (!data) return <p className="text-muted-foreground">{t("common.loading", locale)}</p>;

  const { node, edges, related } = data;

  return (
    <article className="space-y-6 sm:space-y-8">
      <div>
        <Link to="/graph" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("node.back", locale)}</Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{node.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TypeBadge type={node.node_type} />
          <StatusBadge status={node.status} />
          <span className="text-xs text-muted-foreground">{new Date(node.created_at).toLocaleDateString(locale)}</span>
          {node.word_count_es && <span className="text-xs text-muted-foreground">{t("node.words", locale, { count: locale === "es" ? node.word_count_es : (node.word_count_en ?? node.word_count_es) })}</span>}
        </div>
      </div>
      <div className="space-y-4">
        <div><h2 className="mb-1 text-sm font-medium text-muted-foreground">{t("node.summary_es", locale)}</h2><p className="leading-relaxed">{localized(node, "summary", "es")}</p></div>
        <div><h2 className="mb-1 text-sm font-medium text-muted-foreground">{t("node.summary_en", locale)}</h2><p className="leading-relaxed text-muted-foreground">{localized(node, "summary", "en")}</p></div>
      </div>
      <div className="flex flex-wrap gap-1.5">{node.tags.map((tg) => <TagBadge key={tg} tag={tg} />)}</div>
      {related.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t("node.related", locale, { count: edges.length })}</h2>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.id} to={`/node?id=${r.id}`}>
                <Card className="transition hover:border-border/80">
                  <CardContent className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className="truncate pr-2">{r.title}</span>
                    <TypeBadge type={r.node_type} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
