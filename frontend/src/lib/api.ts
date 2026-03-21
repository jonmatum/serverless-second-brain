import type { GraphResponse, SearchResponse, NodeResponse } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  graph: (params?: { type?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return get<GraphResponse>(`/graph${qs ? `?${qs}` : ""}`);
  },
  search: (query: string, params?: { limit?: number; type?: string; status?: string }) => {
    const q = new URLSearchParams({ q: query });
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.type) q.set("type", params.type);
    if (params?.status) q.set("status", params.status);
    return get<SearchResponse>(`/search?${q}`);
  },
  node: (slug: string) => get<NodeResponse>(`/nodes/${slug}`),
};
