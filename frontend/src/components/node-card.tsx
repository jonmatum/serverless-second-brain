import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
    <Link to={`/node?id=${id}`}>
      <Card className="transition hover:border-border/80 hover:bg-accent/50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium truncate">{title}</h3>
            <div className="flex shrink-0 items-center gap-2">
              {score != null && <span className="text-xs text-muted-foreground">{Math.round(score * 100)}%</span>}
              <TypeBadge type={node_type} />
            </div>
          </div>
          {summary && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{summary}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <StatusBadge status={status} />
            {tags.slice(0, 3).map((tg) => <TagBadge key={tg} tag={tg} />)}
            {tags.length > 3 && <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>}
            {extra}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
