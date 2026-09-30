"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { itemKindLabels, linkTypeLabels } from "@/lib/data/labels";
import type {
  GraphEdgeType,
  GraphNodeType,
  ItemKind,
  LinkType,
} from "@/lib/data/types";
import { cn } from "@/lib/utils";

export type VizNode = {
  id: string;
  type: GraphNodeType;
  label: string;
  kind: ItemKind | null;
  state: "active" | "draft" | "retired" | "replaced" | "left";
  owner: string | null;
  subject: string | null;
};

export type VizEdge = {
  id: string;
  from: string;
  to: string;
  type: GraphEdgeType;
  suggested: boolean;
  reason: string | null;
};

type Stats = {
  sources: number;
  documents: number;
  links: number;
  people: number;
};

type Point = { x: number; y: number };
type View = { x: number; y: number; k: number };

const knowledgeTypes: GraphEdgeType[] = [
  "supersedes",
  "contradicts",
  "variant_of",
  "duplicate_of",
  "supports",
  "based_on",
  "answered_with",
];
const isKnowledge = (type: GraphEdgeType): type is LinkType =>
  knowledgeTypes.includes(type);

const incomingLabels: Record<LinkType, string> = {
  supersedes: "Replaced by",
  contradicts: "Contradicted by",
  variant_of: "Variant of",
  duplicate_of: "Has a copy",
  supports: "Supported by",
  based_on: "Source for",
  answered_with: "Used in answer",
};

const nodeTypeLabels: Record<GraphNodeType, string> = {
  item: "Source",
  colleague: "Colleague",
  team: "Team",
  customer: "Customer",
  country: "Country",
  subject: "Subject",
  document_type: "Document type",
};

const linkStroke: Record<LinkType, string> = {
  supersedes: "stroke-brand-yellow",
  contradicts: "stroke-brand-red",
  based_on: "stroke-blue-300",
  supports: "stroke-blue-300",
  answered_with: "stroke-blue-300",
  variant_of: "stroke-white/60",
  duplicate_of: "stroke-white/60",
};

const linkSwatch: Record<LinkType, string> = {
  supersedes: "bg-brand-yellow",
  contradicts: "bg-brand-red",
  based_on: "bg-blue-300",
  supports: "bg-blue-300",
  answered_with: "bg-blue-300",
  variant_of: "bg-white/60",
  duplicate_of: "bg-white/60",
};

const arrowTypes: Partial<Record<LinkType, string>> = {
  supersedes: "fill-brand-yellow",
  based_on: "fill-blue-300",
  supports: "fill-blue-300",
  answered_with: "fill-blue-300",
};

const springs: Record<GraphEdgeType, [length: number, strength: number]> = {
  supersedes: [70, 0.5],
  contradicts: [80, 0.5],
  variant_of: [70, 0.4],
  duplicate_of: [45, 0.6],
  supports: [70, 0.4],
  based_on: [70, 0.5],
  answered_with: [70, 0.3],
  about: [55, 0.25],
  owned_by: [90, 0.06],
  maintained_by: [140, 0.03],
  member_of: [50, 0.2],
  concerns: [80, 0.12],
  applies_to: [180, 0.02],
  typed_as: [120, 0.02],
  accessible_to: [140, 0.01],
  authored_by: [90, 0.04],
};

const charges: Record<GraphNodeType, number> = {
  item: 1,
  colleague: 1,
  team: 1.6,
  customer: 2.2,
  country: 2.5,
  subject: 1.8,
  document_type: 1,
};

function simulate(
  nodes: VizNode[],
  edges: VizEdge[],
  start: Point[],
  ticks: number,
  startAlpha: number,
  pinned?: { index: number; point: Point },
): Point[] {
  const bodies = nodes.map((node, i) => ({
    x: start[i]?.x ?? 0,
    y: start[i]?.y ?? 0,
    vx: 0,
    vy: 0,
    charge: charges[node.type],
  }));
  const byId = new Map(nodes.map((node, i) => [node.id, bodies[i]]));
  const springList = edges.flatMap((edge) => {
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) return [];
    const [length, strength] = springs[edge.type];
    return [{ a, b, length, strength }];
  });
  const pinnedBody = pinned ? bodies[pinned.index] : undefined;
  const decay = Math.pow(0.002 / startAlpha, 1 / ticks);
  let alpha = startAlpha;

  for (let tick = 0; tick < ticks; tick++) {
    bodies.forEach((a, i) => {
      for (const b of bodies.slice(i + 1)) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = Math.max(dx * dx + dy * dy, 36);
        if (d2 > 160000) continue;
        const force = (alpha * 140 * a.charge * b.charge) / d2;
        a.vx -= dx * force;
        a.vy -= dy * force;
        b.vx += dx * force;
        b.vy += dy * force;
      }
    });
    for (const { a, b, length, strength } of springList) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const pull = ((d - length) / d) * strength * alpha * 0.5;
      a.vx += dx * pull;
      a.vy += dy * pull;
      b.vx -= dx * pull;
      b.vy -= dy * pull;
    }
    for (const body of bodies) {
      body.vx = (body.vx - body.x * 0.02 * alpha) * 0.6;
      body.vy = (body.vy - body.y * 0.036 * alpha) * 0.6;
      body.x += body.vx;
      body.y += body.vy;
    }
    if (pinned && pinnedBody) {
      pinnedBody.x = pinned.point.x;
      pinnedBody.y = pinned.point.y;
      pinnedBody.vx = 0;
      pinnedBody.vy = 0;
    }
    alpha *= decay;
  }
  return bodies.map(({ x, y }) => ({ x, y }));
}

const spiral = (count: number): Point[] =>
  Array.from({ length: count }, (_, i) => {
    const radius = 14 * Math.sqrt(i + 0.5);
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });

const round = (value: number) => Math.round(value * 10) / 10;

function nodeRadius(node: VizNode, degree: number) {
  if (node.type === "item") {
    return node.kind === "document" ? 5 + Math.min(degree, 10) * 0.35 : 3.5;
  }
  if (node.type === "customer") return 6;
  if (node.type === "colleague") return 4.5;
  return 3;
}

function truncate(text: string, length: number) {
  return text.length > length
    ? `${text.slice(0, length - 1).trimEnd()}...`
    : text;
}

export function KnowledgeGraph({
  nodes,
  edges,
  stats,
}: {
  nodes: VizNode[];
  edges: VizEdge[];
  stats: Stats;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gesture = useRef<
    | { mode: "drag"; index: number; moved: boolean }
    | { mode: "pan"; client: Point; view: View; moved: boolean }
    | null
  >(null);
  const [positions, setPositions] = useState(() =>
    simulate(nodes, edges, spiral(nodes.length), 360, 1),
  );
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { byId, indexOf, neighbours, degree } = useMemo(() => {
    const neighbours = new Map<string, Set<string>>(
      nodes.map((node) => [node.id, new Set<string>()]),
    );
    for (const edge of edges) {
      neighbours.get(edge.from)?.add(edge.to);
      neighbours.get(edge.to)?.add(edge.from);
    }
    return {
      byId: new Map(nodes.map((node) => [node.id, node])),
      indexOf: new Map(nodes.map((node, i) => [node.id, i])),
      neighbours,
      degree: (id: string) => neighbours.get(id)?.size ?? 0,
    };
  }, [nodes, edges]);

  const focus = selected ?? hovered;
  const lit = useMemo(() => {
    if (!focus) return null;
    return new Set([focus, ...(neighbours.get(focus) ?? [])]);
  }, [focus, neighbours]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        ctm.inverse(),
      );
      setView((current) => {
        const k = Math.min(
          4,
          Math.max(0.5, current.k * Math.exp(-event.deltaY * 0.0015)),
        );
        return {
          k,
          x: p.x - ((p.x - current.x) * k) / current.k,
          y: p.y - ((p.y - current.y) * k) / current.k,
        };
      });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      svg.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const toWorld = (clientX: number, clientY: number): Point | null => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: (p.x - view.x) / view.k, y: (p.y - view.y) / view.k };
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    svgRef.current?.setPointerCapture(event.pointerId);
    const nodeId = (event.target as Element)
      .closest("[data-node]")
      ?.getAttribute("data-node");
    const index = nodeId ? indexOf.get(nodeId) : undefined;
    gesture.current =
      index === undefined
        ? {
            mode: "pan",
            client: { x: event.clientX, y: event.clientY },
            view,
            moved: false,
          }
        : { mode: "drag", index, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    if (!current) return;
    if (current.mode === "drag") {
      const point = toWorld(event.clientX, event.clientY);
      if (!point) return;
      current.moved = true;
      setPositions((previous) =>
        simulate(nodes, edges, previous, 6, 0.15, {
          index: current.index,
          point,
        }),
      );
      return;
    }
    const scale = svgRef.current?.getScreenCTM()?.a ?? 1;
    const dx = (event.clientX - current.client.x) / scale;
    const dy = (event.clientY - current.client.y) / scale;
    if (Math.abs(dx) + Math.abs(dy) > 2) current.moved = true;
    setView({
      ...current.view,
      x: current.view.x + dx,
      y: current.view.y + dy,
    });
  };

  const onPointerUp = () => {
    const current = gesture.current;
    gesture.current = null;
    if (!current || current.moved) return;
    if (current.mode === "pan") {
      setSelected(null);
      return;
    }
    const id = nodes[current.index]?.id;
    if (!id) return;
    setSelected((previous) => (previous === id ? null : id));
  };

  const dim = (id: string) => lit !== null && !lit.has(id);
  const edgeLit = (edge: VizEdge) =>
    focus !== null && (edge.from === focus || edge.to === focus);

  const at = (id: string) => {
    const index = indexOf.get(id);
    return index === undefined ? null : (positions[index] ?? null);
  };

  const structural = edges.filter(
    (edge) => !isKnowledge(edge.type) && edge.type !== "applies_to",
  );
  const knowledge = edges.filter((edge) => isKnowledge(edge.type));
  const selectedNode = selected ? byId.get(selected) : undefined;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[65px] overflow-hidden bg-blue-950 text-white">
      <svg
        ref={svgRef}
        viewBox="-640 -470 1480 940"
        className="absolute inset-0 size-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (gesture.current = null)}
      >
        <defs>
          {Object.entries(arrowTypes).map(([type, fill]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,1 L10,5 L0,9 z" className={fill} />
            </marker>
          ))}
        </defs>

        <g
          transform={`translate(${round(view.x)} ${round(view.y)}) scale(${view.k})`}
        >
          {nodes.map((node, i) =>
            node.type === "country" ? (
              <text
                key={node.id}
                x={round(positions[i]?.x ?? 0)}
                y={round(positions[i]?.y ?? 0)}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "font-heading pointer-events-none fill-white text-[88px] font-semibold tracking-[-0.02em] transition-opacity duration-200",
                  dim(node.id) ? "opacity-[0.03]" : "opacity-[0.07]",
                )}
              >
                {node.label}
              </text>
            ) : null,
          )}

          {structural.map((edge) => {
            const a = at(edge.from);
            const b = at(edge.to);
            if (!a || !b) return null;
            const on = edgeLit(edge);
            return (
              <line
                key={edge.id}
                x1={round(a.x)}
                y1={round(a.y)}
                x2={round(b.x)}
                y2={round(b.y)}
                vectorEffect="non-scaling-stroke"
                className={cn(
                  "transition-[stroke] duration-200",
                  on
                    ? "stroke-white/45"
                    : lit
                      ? "stroke-white/[0.03]"
                      : "stroke-white/[0.11]",
                )}
                strokeWidth={on ? 1 : 0.75}
              />
            );
          })}

          {knowledge.map((edge) => {
            const a = at(edge.from);
            const b = at(edge.to);
            const target = byId.get(edge.to);
            if (!a || !b || !target || !isKnowledge(edge.type)) return null;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const length = Math.sqrt(dx * dx + dy * dy) || 1;
            const cx = (a.x + b.x) / 2 - dy * 0.18;
            const cy = (a.y + b.y) / 2 + dx * 0.18;
            const ex = b.x - cx;
            const ey = b.y - cy;
            const el = Math.sqrt(ex * ex + ey * ey) || 1;
            const inset = Math.min(
              nodeRadius(target, degree(edge.to)) + 3,
              length / 3,
            );
            const end = {
              x: b.x - (ex / el) * inset,
              y: b.y - (ey / el) * inset,
            };
            const faded = lit !== null && !edgeLit(edge);
            return (
              <path
                key={edge.id}
                d={`M${round(a.x)},${round(a.y)} Q${round(cx)},${round(cy)} ${round(end.x)},${round(end.y)}`}
                fill="none"
                strokeWidth={edgeLit(edge) ? 2.25 : 1.75}
                strokeLinecap="round"
                strokeDasharray={edge.suggested ? "3 5" : undefined}
                markerEnd={
                  arrowTypes[edge.type] ? `url(#arrow-${edge.type})` : undefined
                }
                className={cn(
                  linkStroke[edge.type],
                  "transition-opacity duration-200",
                  faded ? "opacity-15" : "opacity-100",
                )}
              />
            );
          })}

          {nodes.map((node, i) => {
            if (node.type === "country") return null;
            const { x, y } = positions[i] ?? { x: 0, y: 0 };
            const r = nodeRadius(node, degree(node.id));
            const on = focus === node.id;
            const showLabel =
              node.type === "subject" ||
              node.type === "customer" ||
              node.type === "team" ||
              on ||
              (lit?.has(node.id) ?? false) ||
              (node.kind === "document" && view.k >= 1.7);
            return (
              <g
                key={node.id}
                data-node={node.id}
                transform={`translate(${round(x)} ${round(y)})`}
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() =>
                  setHovered((current) =>
                    current === node.id ? null : current,
                  )
                }
                className={cn(
                  "cursor-pointer transition-opacity duration-200",
                  dim(node.id) ? "opacity-20" : "opacity-100",
                )}
              >
                <circle r={Math.max(r + 5, 10)} className="fill-transparent" />
                {on ? (
                  <circle
                    r={r + 5}
                    fill="none"
                    strokeWidth={1}
                    className="stroke-white/70"
                  />
                ) : null}
                <NodeMark node={node} r={r} />
                {showLabel ? <NodeLabel node={node} r={r} strong={on} /> : null}
              </g>
            );
          })}
        </g>
      </svg>

      <header className="pointer-events-none absolute left-0 top-0 max-w-[30rem] bg-blue-950 pb-6 pl-8 pr-8 pt-8">
        <p className="text-brand-yellow text-sm font-medium uppercase tracking-[0.08em]">
          Trust graph
        </p>
        <h1 className="mt-3 text-4xl leading-[1.1] text-white">
          How our knowledge connects
        </h1>
        <p className="mt-4 text-white/65">
          {stats.sources} sources, {stats.documents} of them documents, tied
          together by {stats.links} typed links and {stats.people} people who
          own, write or answer with them.
        </p>
        <p className="mt-3 text-sm text-white/40">
          Scroll to zoom, drag to move. Click a source to see its links.
        </p>
      </header>

      {selectedNode ? null : <Legend />}

      {selectedNode ? (
        <Details
          node={selectedNode}
          edges={edges.filter(
            (edge) =>
              edge.from === selectedNode.id || edge.to === selectedNode.id,
          )}
          byId={byId}
          onSelect={setSelected}
        />
      ) : null}
    </div>
  );
}

function NodeMark({ node, r }: { node: VizNode; r: number }) {
  if (node.type === "item" && node.kind === "document") {
    if (node.state === "replaced" || node.state === "retired") {
      return (
        <circle
          r={r}
          strokeWidth={1.5}
          className="fill-blue-950 stroke-blue-300/60"
        />
      );
    }
    if (node.state === "draft") {
      return (
        <circle
          r={r}
          strokeWidth={1.5}
          strokeDasharray="2 2"
          className="fill-blue-300/25 stroke-blue-300"
        />
      );
    }
    return <circle r={r} className="fill-blue-300" />;
  }
  if (node.type === "item") return <circle r={r} className="fill-white/65" />;
  if (node.type === "colleague") {
    return (
      <circle
        r={r}
        strokeWidth={1.5}
        className={cn(
          "fill-blue-950",
          node.state === "left" ? "stroke-brand-red" : "stroke-white/75",
        )}
      />
    );
  }
  if (node.type === "customer") {
    return (
      <rect
        x={-r}
        y={-r}
        width={r * 2}
        height={r * 2}
        rx={1.5}
        strokeWidth={1.5}
        className="fill-blue-900 stroke-blue-300"
      />
    );
  }
  if (node.type === "subject") {
    return <circle r={r} className="fill-brand-yellow" />;
  }
  return <circle r={r} className="fill-white/30" />;
}

function NodeLabel({
  node,
  r,
  strong,
}: {
  node: VizNode;
  r: number;
  strong: boolean;
}) {
  const halo = "stroke-blue-950 [paint-order:stroke]";
  if (node.type === "subject") {
    return (
      <text
        y={-r - 7}
        textAnchor="middle"
        strokeWidth={4}
        className={cn(
          halo,
          "fill-brand-yellow pointer-events-none text-[9px] font-medium uppercase tracking-[0.08em]",
        )}
      >
        {node.label}
      </text>
    );
  }
  if (node.type === "team") {
    return (
      <text
        x={r + 5}
        dy="0.35em"
        strokeWidth={4}
        className={cn(halo, "pointer-events-none fill-white/45 text-[9px]")}
      >
        {node.label}
      </text>
    );
  }
  return (
    <text
      x={r + 5}
      dy="0.35em"
      strokeWidth={4}
      className={cn(
        halo,
        "pointer-events-none",
        node.type === "customer"
          ? "fill-white text-[12px] font-medium"
          : strong
            ? "fill-white text-[11px] font-medium"
            : "fill-white/80 text-[10px]",
      )}
    >
      {truncate(node.label, strong ? 60 : 38)}
    </text>
  );
}

function Legend() {
  const marks: { label: string; mark: React.ReactNode }[] = [
    {
      label: "Document",
      mark: <circle cx={8} cy={8} r={5} className="fill-blue-300" />,
    },
    {
      label: "Replaced document",
      mark: (
        <circle
          cx={8}
          cy={8}
          r={4.5}
          strokeWidth={1.5}
          className="fill-blue-950 stroke-blue-300/60"
        />
      ),
    },
    {
      label: "Email, call, chat or ticket",
      mark: <circle cx={8} cy={8} r={3} className="fill-white/65" />,
    },
    {
      label: "Colleague",
      mark: (
        <circle
          cx={8}
          cy={8}
          r={4}
          strokeWidth={1.5}
          className="fill-none stroke-white/75"
        />
      ),
    },
    {
      label: "Colleague who left",
      mark: (
        <circle
          cx={8}
          cy={8}
          r={4}
          strokeWidth={1.5}
          className="stroke-brand-red fill-none"
        />
      ),
    },
    {
      label: "Customer",
      mark: (
        <rect
          x={3}
          y={3}
          width={10}
          height={10}
          rx={1.5}
          strokeWidth={1.5}
          className="fill-blue-900 stroke-blue-300"
        />
      ),
    },
  ];
  const lines: { label: string; type: LinkType; dashed?: boolean }[] = [
    { label: linkTypeLabels.supersedes, type: "supersedes" },
    { label: linkTypeLabels.contradicts, type: "contradicts" },
    { label: "Supports or based on", type: "supports" },
    { label: "Copy or variant", type: "duplicate_of" },
    {
      label: "Suggested, waiting for owner",
      type: "contradicts",
      dashed: true,
    },
  ];

  return (
    <aside className="pointer-events-none absolute bottom-8 right-8 hidden gap-10 text-xs text-white/60 md:flex">
      <ul className="flex flex-col gap-2">
        {marks.map(({ label, mark }) => (
          <li key={label} className="flex items-center gap-2.5">
            <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden>
              {mark}
            </svg>
            {label}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-2">
        {lines.map(({ label, type, dashed }) => (
          <li key={label} className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0" aria-hidden>
              <line
                x1={1}
                y1={8}
                x2={23}
                y2={8}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={dashed ? "3 4" : undefined}
                className={linkStroke[type]}
              />
            </svg>
            {label}
          </li>
        ))}
        <li className="mt-1 flex items-center gap-2.5">
          <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0" aria-hidden>
            <circle cx={12} cy={8} r={2.5} className="fill-brand-yellow" />
          </svg>
          Subject
        </li>
      </ul>
    </aside>
  );
}

function Details({
  node,
  edges,
  byId,
  onSelect,
}: {
  node: VizNode;
  edges: VizEdge[];
  byId: Map<string, VizNode>;
  onSelect: (id: string) => void;
}) {
  const links = edges.filter((edge) => isKnowledge(edge.type));
  const related = edges
    .filter((edge) => !isKnowledge(edge.type))
    .map((edge) => byId.get(edge.from === node.id ? edge.to : edge.from))
    .filter((other): other is VizNode => other !== undefined)
    .sort(
      (a, b) =>
        Number(b.kind === "document") - Number(a.kind === "document") ||
        a.label.localeCompare(b.label),
    );
  const sources = related.filter((other) => other.type === "item");
  const eyebrow =
    node.type === "item" && node.kind
      ? [
          itemKindLabels[node.kind],
          node.state === "replaced" ? "Replaced" : null,
          node.state === "draft" ? "Draft" : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : node.state === "left"
        ? "Colleague who left"
        : nodeTypeLabels[node.type];

  return (
    <section className="absolute right-8 top-8 flex max-h-[calc(100%-4rem)] w-[360px] max-w-[calc(100%-4rem)] flex-col gap-5 overflow-y-auto border-l border-white/20 bg-blue-950 py-1 pl-5">
      <div className="flex flex-col gap-2">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-[0.08em]",
            node.state === "left" ? "text-brand-red" : "text-blue-300",
          )}
        >
          {eyebrow}
        </p>
        <h2 className="text-xl leading-tight text-white">{node.label}</h2>
        {node.type === "item" ? (
          <p className="text-sm text-white/60">
            {node.owner ? `Owned by ${node.owner}` : "No owner"}
            {node.subject ? `. ${node.subject}` : ""}
          </p>
        ) : node.subject ? (
          <p className="text-sm text-white/60">{node.subject}</p>
        ) : null}
      </div>

      {links.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {links.map((edge) => {
            if (!isKnowledge(edge.type)) return null;
            const outgoing = edge.from === node.id;
            const other = byId.get(outgoing ? edge.to : edge.from);
            if (!other) return null;
            return (
              <li key={edge.id} className="flex flex-col gap-1">
                <p className="flex items-center gap-2 text-xs text-white/60">
                  <span
                    className={cn(
                      "h-0.5 w-4 rounded-sm",
                      linkSwatch[edge.type],
                    )}
                  />
                  {outgoing
                    ? linkTypeLabels[edge.type]
                    : incomingLabels[edge.type]}
                  {edge.suggested ? ", suggested" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => onSelect(other.id)}
                  className="text-left text-sm font-medium text-white transition-colors duration-150 hover:text-blue-300"
                >
                  {other.label}
                </button>
                {edge.reason ? (
                  <p className="text-sm text-white/55">{edge.reason}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {node.type !== "item" && sources.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/60">
            {sources.length} {sources.length === 1 ? "source" : "sources"}
          </p>
          <ul className="flex flex-col gap-1.5">
            {sources.slice(0, 8).map((other) => (
              <li key={other.id}>
                <button
                  type="button"
                  onClick={() => onSelect(other.id)}
                  className="text-left text-sm text-white/85 transition-colors duration-150 hover:text-blue-300"
                >
                  {other.label}
                </button>
              </li>
            ))}
          </ul>
          {sources.length > 8 ? (
            <p className="text-xs text-white/40">
              and {sources.length - 8} more
            </p>
          ) : null}
        </div>
      ) : null}

      {node.type === "item" ? (
        <Link
          href={`/documents/${node.id}`}
          className="text-sm font-medium text-blue-300 transition-colors duration-150 hover:text-white"
        >
          Open {node.kind === "document" ? "document" : "source"}
        </Link>
      ) : null}
    </section>
  );
}
