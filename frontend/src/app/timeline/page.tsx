"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { GraphNode } from "@/lib/types";
import { TypeBadge, StatusBadge } from "@/components/badges";
import { Filters } from "@/components/filters";
import { t } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

export default function TimelinePage() {
  const { locale } = usePrefs();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.graph({ type: type || undefined, status: status || undefined }).then((d) => setNodes(d.nodes));
  }, [type, status]);

  const sorted = [...nodes].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-4">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-2xl font-bold">{t("timeline.title", locale)}</h1>
        <Filters type={type} status={status} onTypeChange={setType} onStatusChange={setStatus} />
      </div>
      <p className="text-sm text-muted-foreground">{t("timeline.count", locale, { count: sorted.length })}</p>
      <div className="space-y-0.5">
        {sorted.map((n) => (
          <Link
            key={n.id}
            href={`/node?id=${n.id}`}
            className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{n.title}</span>
              <span className="hidden sm:inline-flex"><TypeBadge type={n.node_type} /></span>
            </div>
            <StatusBadge status={n.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
