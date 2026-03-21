
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
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

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function ForceGraph({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();

  const navigate = useCallback(
    (id: string) => router.push(`/node?id=${id}`),
    [router],
  );

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
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(12));

    const g = svg.append("g");

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5])
        .on("zoom", (e) => g.attr("transform", e.transform)),
    );

    const link = g
      .append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "#3f3f46")
      .attr("stroke-width", 1);

    const node = g
      .append("g")
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(simNodes)
      .join("circle")
      .attr("r", (d) => 4 + Math.min(d.edge_count, 10))
      .attr("fill", (d) => TYPE_COLORS[d.node_type] ?? "#71717a")
      .attr("stroke", "#18181b")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (_, d) => navigate(d.id))
      .call(drag(sim));

    // Tooltip
    node.append("title").text((d) => d.title);

    // Labels for high-connectivity nodes
    const labels = g
      .append("g")
      .selectAll("text")
      .data(simNodes.filter((d) => d.edge_count >= 4))
      .join("text")
      .text((d) => d.title)
      .attr("font-size", 10)
      .attr("fill", "#a1a1aa")
      .attr("dx", 10)
      .attr("dy", 4)
      .attr("pointer-events", "none");

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);
      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      labels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => { sim.stop(); };
  }, [nodes, edges, navigate]);

  return (
    <svg
      ref={svgRef}
      className="h-[50vh] w-full rounded-lg border border-border bg-background sm:h-[70vh]"
    />
  );
}

function drag(sim: d3.Simulation<SimNode, SimLink>) {
  return d3
    .drag<SVGCircleElement, SimNode>()
    .on("start", (e, d) => {
      if (!e.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (e, d) => {
      d.fx = e.x;
      d.fy = e.y;
    })
    .on("end", (e, d) => {
      if (!e.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}
