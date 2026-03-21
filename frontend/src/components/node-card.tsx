import { Link } from "react-router-dom";
import { TypeBadge, StatusBadge, TagBadge } from "./badges";

interface Props {
  id: string;
  title: string;
  summary?: string;
  node_type: string;
  status: string;
  tags: string[];
  score?: number;
  extra?: React.ReactNode;
}

export function NodeCard({ id, title, summary, node_type, status, tags, score, extra }: Props) {
  return (
    <Link to={`/node?id=${id}`} className="block rounded-lg border border-[var(--color-border)] p-3 sm:p-4 transition-all hover:border-[var(--color-accent)] hover:shadow-[0_0_20px_-5px_var(--color-accent)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium truncate">{title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {score != null && <span className="text-xs text-[var(--color-muted)]">{Math.round(score * 100)}%</span>}
          <TypeBadge type={node_type} />
        </div>
      </div>
      {summary && <p className="mt-1.5 text-sm text-[var(--color-muted)] line-clamp-2">{summary}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <StatusBadge status={status} />
        {tags.slice(0, 3).map((tg) => <TagBadge key={tg} tag={tg} />)}
        {tags.length > 3 && <span className="text-xs text-[var(--color-muted)]">+{tags.length - 3}</span>}
        {extra}
      </div>
    </Link>
  );
}
