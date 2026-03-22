import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Maximize2, Minimize2, Search, X } from "lucide-react";
import * as d3 from "d3";
import type { GraphNode, GraphEdge } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/constants";

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  node_type: string;
  status: string;
  edge_count: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  edge_type: string;
}

export function ForceGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string } | null>(null);
  const [search, setSearch] = useState("");

  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown> | null>(null);
  const labelSelRef = useRef<d3.Selection<SVGTextElement, SimNode, SVGGElement, unknown> | null>(null);

  const go = useCallback((id: string) => navigate(`/node?id=${id}`), [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll("*").remove();

    const { width, height } = svgRef.current!.getBoundingClientRect();

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({ source: e.source, target: e.target, edge_type: e.edge_type }));

    const sim = d3
      .forceSimulation(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const g = svg.append("g");

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5])
        .on("zoom", (e) => g.attr("transform", e.transform)) as never,
    );

    g.selectAll("line").data(simLinks).join("line")
      .attr("stroke", "var(--color-border)")
      .attr("stroke-width", 1);

    const node = g.selectAll<SVGCircleElement, SimNode>("circle").data(simNodes).join("circle")
      .attr("r", 8)
      .attr("fill", (d) => TYPE_COLORS[d.node_type] ?? "#888")
      .attr("cursor", "pointer")
      .on("click", (_, d) => go(d.id))
      .on("mouseenter", (e, d) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, title: d.title });
      })
      .on("mousemove", (e) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip((t) => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top - 10 } : null);
      })
      .on("mouseleave", () => setTooltip(null))
      .call(drag(sim));

    const label = g.selectAll<SVGTextElement, SimNode>("text").data(simNodes).join("text")
      .text((d) => d.title)
      .attr("font-size", 11)
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("fill", "var(--color-muted)")
      .attr("cursor", "pointer")
      .on("click", (_, d) => go(d.id));

    nodeSelRef.current = node;
    labelSelRef.current = label;

    const link = g.selectAll("line");

    sim.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      label.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => { sim.stop(); };
  }, [nodes, edges, go, fullscreen]);

  // Highlight matching nodes on search
  useEffect(() => {
    const nodeSel = nodeSelRef.current;
    const labelSel = labelSelRef.current;
    if (!nodeSel || !labelSel) return;

    if (search.length < 2) {
      nodeSel.attr("opacity", 1).attr("r", 8);
      labelSel.attr("opacity", 1).attr("font-weight", null);
      return;
    }

    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    const match = (d: SimNode) => terms.every((t) => d.title.toLowerCase().includes(t));

    nodeSel.attr("opacity", (d) => match(d) ? 1 : 0.15).attr("r", (d) => match(d) ? 10 : 6);
    labelSel.attr("opacity", (d) => match(d) ? 1 : 0.1).attr("font-weight", (d) => match(d) ? "bold" : null);
  }, [search]);

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-[var(--color-bg)]" : "relative"}>
      {/* Search overlay */}
      <div className="absolute left-3 top-3 z-10">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1.5 pl-8 pr-7 text-xs outline-none focus:border-[var(--color-accent)]" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-fg)]" aria-label="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen toggle */}
      <button onClick={() => setFullscreen((f) => !f)}
        className="absolute right-3 top-3 z-10 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-1.5 text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
        aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
        {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      <svg ref={svgRef}
        className={fullscreen ? "h-full w-full" : "h-[400px] w-full rounded-lg border border-[var(--color-border)] md:h-[600px]"} />

      {/* Tooltip */}
      {tooltip && (
        <div className="pointer-events-none absolute z-50 rounded-md bg-[var(--color-fg)] px-2.5 py-1.5 text-xs text-[var(--color-bg)]"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}>
          <div className="font-medium">{tooltip.title}</div>
        </div>
      )}
    </div>
  );
}

function drag(sim: d3.Simulation<SimNode, SimLink>) {
  return d3.drag<SVGCircleElement, SimNode>()
    .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
}
