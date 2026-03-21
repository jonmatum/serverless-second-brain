import Link from "next/link";
import { TypeBadge, StatusBadge, Tag } from "./badges";

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
    <Link
      href={`/node?id=${id}`}
      className="block rounded-lg border border-zinc-800 p-4 transition hover:border-zinc-600 hover:bg-zinc-900/50"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {score != null && (
            <span className="text-xs text-zinc-500">{Math.round(score * 100)}%</span>
          )}
          <TypeBadge type={node_type} />
        </div>
      </div>
      {summary && (
        <p className="mt-1.5 text-sm text-zinc-400 line-clamp-2">{summary}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {tags.slice(0, 5).map((t) => (
          <Tag key={t} tag={t} />
        ))}
        {tags.length > 5 && (
          <span className="text-xs text-zinc-500">+{tags.length - 5}</span>
        )}
        {extra}
      </div>
    </Link>
  );
}
