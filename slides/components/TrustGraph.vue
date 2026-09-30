<script setup lang="ts">
import { computed, ref } from "vue";
import { onSlideEnter } from "@slidev/client";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import {
  clusterCenters,
  focusIds,
  focusLayout,
  linkLegend,
  links,
  nodes,
  type GraphNode,
  type LinkType,
} from "./trust-graph-data";

const props = defineProps<{ step: number }>();

const width = 1120;
const height = 630;

type SimNode = GraphNode &
  SimulationNodeDatum & { x: number; y: number; r: number };
type SimLink = SimulationLinkDatum<SimNode> & { type: LinkType };

function radius(node: GraphNode) {
  if (node.id === "doc-05") return 12;
  if (node.kind === "document") return 9;
  if (node.kind === "person") return 7;
  return 4.5;
}

const simNodes: SimNode[] = nodes.map((node, i) => {
  const center = clusterCenters[node.cluster];
  const fixed = focusLayout[node.id];
  if (fixed) {
    const angle = (fixed.angle * Math.PI) / 180;
    const x = center.x + Math.cos(angle) * fixed.distance;
    const y = center.y + Math.sin(angle) * fixed.distance;
    return { ...node, r: radius(node), x, y, fx: x, fy: y };
  }
  const angle = i * 2.39996;
  const distance = 12 + 6 * Math.sqrt(i % 17);
  return {
    ...node,
    r: radius(node),
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
  };
});

const simLinks: SimLink[] = links.map((link) => ({
  source: link.from,
  target: link.to,
  type: link.type,
}));

forceSimulation<SimNode>(simNodes)
  .force(
    "link",
    forceLink<SimNode, SimLink>(simLinks)
      .id((node) => node.id)
      .distance((link) => (link.type === "owns" ? 34 : 52))
      .strength((link) =>
        (link.source as SimNode).cluster === (link.target as SimNode).cluster
          ? 0.6
          : 0.05,
      ),
  )
  .force("charge", forceManyBody<SimNode>().strength(-45).distanceMax(160))
  .force(
    "collide",
    forceCollide<SimNode>((node) => node.r + 9),
  )
  .force(
    "x",
    forceX<SimNode>((node) => clusterCenters[node.cluster].x).strength(0.2),
  )
  .force(
    "y",
    forceY<SimNode>((node) => clusterCenters[node.cluster].y).strength(0.2),
  )
  .stop()
  .tick(400);

for (const node of simNodes) {
  node.x = Math.min(width - 40, Math.max(40, node.x));
  node.y = Math.min(height - 60, Math.max(40, node.y));
}

function endpoint(link: SimLink) {
  const source = link.source as SimNode;
  const target = link.target as SimNode;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy) || 1;
  const gap = target.r + (link.type === "supersedes" ? 4 : 1);
  return {
    x1: source.x + (dx / length) * source.r,
    y1: source.y + (dy / length) * source.r,
    x2: target.x - (dx / length) * gap,
    y2: target.y - (dy / length) * gap,
  };
}

const drawnLinks = computed(() =>
  simLinks.map((link, i) => {
    const source = link.source as SimNode;
    const target = link.target as SimNode;
    return {
      key: `${source.id}-${target.id}`,
      type: link.type,
      focus: focusIds.has(source.id) && focusIds.has(target.id),
      delay: 40 + i * 18,
      ...endpoint(link),
    };
  }),
);

const statusVisible = computed(() => props.step >= 1);
const focused = computed(() => props.step >= 2);

const labelled = computed(() =>
  focused.value
    ? simNodes.filter((node) => focusIds.has(node.id) && node.label)
    : [],
);

function labelPosition(node: SimNode) {
  const center = clusterCenters.birth;
  if (node.id === "p-pieter")
    return { x: node.x, y: node.y + node.r + 16, anchor: "middle" };
  const right = node.x >= center.x;
  const offset = node.r + 7;
  return {
    x: right ? node.x + offset : node.x - offset,
    y: node.y + 4,
    anchor: right ? "start" : "end",
  };
}

const clusterLabels = Object.entries(clusterCenters).map(([key, center]) => {
  const members = simNodes.filter((node) => node.cluster === key);
  const top = Math.min(...members.map((node) => node.y));
  const xs = members.map((node) => node.x);
  return {
    key,
    label: center.label,
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: top - 22,
  };
});

const documentCount = nodes.filter((node) => node.kind !== "person").length;

const replay = ref(0);
onSlideEnter(() => {
  replay.value += 1;
});
</script>

<template>
  <div
    :key="replay"
    class="trust-graph"
    :class="{ 'show-status': statusVisible, focused }"
  >
    <svg :viewBox="`0 0 ${width} ${height}`" class="graph" aria-hidden="true">
      <defs>
        <marker
          id="arrow-supersedes"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" class="arrow" />
        </marker>
      </defs>

      <g class="cluster-labels">
        <text
          v-for="cluster in clusterLabels"
          :key="cluster.key"
          :x="cluster.x"
          :y="cluster.y"
          text-anchor="middle"
        >
          {{ cluster.label }}
        </text>
      </g>

      <g class="links">
        <line
          v-for="link in drawnLinks"
          :key="link.key"
          :class="['link', `link-${link.type}`, { 'link-focus': link.focus }]"
          :x1="link.x1"
          :y1="link.y1"
          :x2="link.x2"
          :y2="link.y2"
          pathLength="1"
          :style="{
            transitionDelay:
              statusVisible && !focused ? `${link.delay}ms` : '0ms',
          }"
          :marker-end="
            link.type === 'supersedes' ? 'url(#arrow-supersedes)' : undefined
          "
        />
      </g>

      <g class="nodes">
        <g
          v-for="(node, i) in simNodes"
          :key="node.id"
          :class="[
            'node',
            `node-${node.kind}`,
            `status-${node.status}`,
            { 'node-focus': focusIds.has(node.id), hero: node.id === 'doc-05' },
          ]"
          :style="{ animationDelay: `${120 + i * 22}ms` }"
          :transform="`translate(${node.x} ${node.y})`"
        >
          <circle v-if="node.id === 'doc-05'" class="halo" :r="node.r + 8" />
          <circle class="dot" :r="node.r" />
        </g>
      </g>

      <g class="labels">
        <text
          v-for="node in labelled"
          :key="node.id"
          :x="labelPosition(node).x"
          :y="labelPosition(node).y"
          :text-anchor="labelPosition(node).anchor"
          :class="{ hero: node.id === 'doc-05' }"
        >
          {{ node.label }}
        </text>
      </g>
    </svg>

    <div class="header">
      <h3>The trust graph</h3>
      <h1 v-if="step < 1">
        {{ documentCount }} items. None of them says which one is right.
      </h1>
      <h1 v-else-if="step < 2">Every link says why two items are related.</h1>
      <h1 v-else>The graph already knows the answer.</h1>

      <p v-if="step < 1" class="caption">
        Documents, emails, calls, meetings, chats and tickets from six systems,
        taken from our synthetic corpus. On disk they all look alike.
      </p>
      <p v-else-if="step < 2" class="caption">
        Links and owners are the trust signals the existing agent never sees.
      </p>
      <p v-else class="caption">
        Birth leave in Belgium is 20 days. Owned by Pieter De Smedt, checked 12
        June 2026. The other four documents are replaced, out of scope or a
        copy.
      </p>
    </div>

    <ul v-if="statusVisible" class="legend">
      <li v-for="item in linkLegend" :key="item.type">
        <svg width="22" height="10" aria-hidden="true">
          <line
            x1="1"
            y1="5"
            x2="21"
            y2="5"
            :class="['link', 'legend-link', `link-${item.type}`]"
          />
        </svg>
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.trust-graph {
  position: absolute;
  inset: 0;
}

.graph {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.header {
  position: absolute;
  top: 3.5rem;
  left: 4rem;
  max-width: 36rem;
}

.header h1 {
  font-size: 2.25rem;
  margin-bottom: 0.75rem;
  animation: fade-up 400ms cubic-bezier(0.2, 0, 0, 1) both;
}

.caption {
  font-size: 1rem;
  color: var(--muted-foreground);
  margin: 0;
  animation: fade-up 400ms 80ms cubic-bezier(0.2, 0, 0, 1) both;
}

.legend {
  position: absolute;
  left: 4rem;
  bottom: 3.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.1rem;
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  animation: fade-up 400ms 160ms cubic-bezier(0.2, 0, 0, 1) both;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  margin: 0;
}

.legend li::before {
  display: none;
}

.cluster-labels text {
  font-family: var(--ds-font-heading);
  font-size: 13px;
  font-weight: 600;
  fill: var(--ds-neutral-500);
  letter-spacing: 0.02em;
  animation: fade-in 600ms 900ms both;
}

.cluster-labels {
  transition: opacity 400ms cubic-bezier(0.2, 0, 0, 1);
}

.focused .cluster-labels {
  opacity: 0;
}

.node {
  animation: node-in 500ms cubic-bezier(0.2, 0, 0, 1) both;
  transition: opacity 400ms cubic-bezier(0.2, 0, 0, 1);
}

.dot {
  fill: var(--ds-neutral-0);
  stroke: var(--ds-neutral-400);
  stroke-width: 1.5;
  transition:
    fill 400ms cubic-bezier(0.2, 0, 0, 1),
    stroke 400ms cubic-bezier(0.2, 0, 0, 1);
}

.node-record .dot {
  fill: var(--ds-neutral-400);
  stroke: none;
}

.node-person .dot {
  fill: var(--ds-neutral-0);
  stroke: var(--heading);
  stroke-width: 2;
}

.halo {
  fill: none;
  stroke: var(--primary);
  stroke-width: 1.5;
  opacity: 0;
  transition: opacity 400ms cubic-bezier(0.2, 0, 0, 1);
}

.show-status .status-current .dot {
  fill: var(--primary);
  stroke: var(--primary);
}

.show-status .status-outdated .dot {
  fill: var(--ds-red-50);
  stroke: var(--ds-red-500);
}

.show-status .status-draft .dot {
  fill: var(--ds-yellow-50);
  stroke: var(--ds-yellow-500);
}

.show-status .status-copy .dot,
.show-status .status-scope .dot {
  fill: var(--ds-neutral-100);
  stroke: var(--ds-neutral-500);
}

.show-status .status-left .dot {
  stroke: var(--ds-red-500);
  stroke-dasharray: 2 2;
}

.focused .node:not(.node-focus) {
  opacity: 0.12;
}

.focused .hero .halo {
  opacity: 1;
  animation: pulse 1800ms 400ms cubic-bezier(0.2, 0, 0, 1) infinite;
  transform-origin: center;
  transform-box: fill-box;
}

.link {
  fill: none;
  stroke-width: 1.5;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
  transition:
    stroke-dashoffset 700ms cubic-bezier(0.2, 0, 0, 1),
    opacity 300ms cubic-bezier(0.2, 0, 0, 1);
}

.show-status .link {
  stroke-dashoffset: 0;
  opacity: 1;
}

.focused .links .link:not(.link-focus) {
  opacity: 0.08;
}

.legend-link {
  stroke-dasharray: none;
  stroke-dashoffset: 0;
  opacity: 1;
  stroke-width: 2;
}

.link-supersedes {
  stroke: var(--heading);
  stroke-width: 2;
}

.arrow {
  fill: var(--heading);
}

.link-contradicts {
  stroke: var(--ds-red-500);
  stroke-width: 2;
}

.link-variant_of {
  stroke: var(--ds-yellow-500);
  stroke-width: 2;
}

.link-duplicate_of {
  stroke: var(--ds-neutral-500);
}

.link-supports {
  stroke: var(--ds-blue-300);
}

.link-owns {
  stroke: var(--ds-neutral-300);
}

.labels text {
  font-family: var(--ds-font-body);
  font-size: 12px;
  font-weight: 500;
  fill: var(--foreground);
  paint-order: stroke;
  stroke: var(--background);
  stroke-width: 4px;
  stroke-linejoin: round;
  animation: fade-in 400ms 300ms both;
}

.labels text.hero {
  font-family: var(--ds-font-heading);
  font-size: 15px;
  font-weight: 600;
  fill: var(--primary);
}

@keyframes node-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}
</style>
