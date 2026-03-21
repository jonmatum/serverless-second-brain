import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { NodeResponse } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { TypeBadge, StatusBadge, TagBadge } from "@/components/badges";
import { TYPE_COLORS } from "@/lib/constants";
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
    setData(null);
    setError("");
    api.node(slug).then(setData).catch((e) => setError(e.message));
  }, [slug]);

  if (!slug) return <p className="py-12 text-center text-muted-foreground">{t("node.empty", locale)}</p>;
  if (error) return <p className="py-12 text-center text-destructive">{t("common.error", locale, { msg: error })}</p>;
  if (!data) return <p className="py-12 text-center text-muted-foreground">{t("common.loading", locale)}</p>;

  const { node, edges, related } = data;

  return (
    <article className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link to="/graph" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("node.back", locale)}
        </Link>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{node.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypeBadge type={node.node_type} />
            <StatusBadge status={node.status} />
            <span className="text-xs text-muted-foreground">{new Date(node.created_at).toLocaleDateString(locale)}</span>
            {node.word_count_es && (
              <span className="text-xs text-muted-foreground">
                {t("node.words", locale, { count: locale === "es" ? node.word_count_es : (node.word_count_en ?? node.word_count_es) })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summaries */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("node.summary_es", locale)}</h2>
            <p className="text-sm leading-relaxed">{localized(node, "summary", "es")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("node.summary_en", locale)}</h2>
            <p className="text-sm leading-relaxed">{localized(node, "summary", "en")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">{node.tags.map((tg) => <TagBadge key={tg} tag={tg} />)}</div>

      {/* Related */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t("node.related", locale, { count: edges.length })}
          </h2>
          <Card>
            <div className="divide-y divide-border">
              {related.map((r) => (
                <Link key={r.id} to={`/node?id=${r.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-colors first:rounded-t-lg last:rounded-b-lg">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[r.node_type] }} />
                  <span className="truncate flex-1">{r.title}</span>
                  <TypeBadge type={r.node_type} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </article>
  );
}
