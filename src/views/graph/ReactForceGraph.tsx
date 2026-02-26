import { useAtomValue } from "jotai/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

import type { Graph } from "@/graph/Graph";
import type { Link } from "@/graph/Link";
import type { Node } from "@/graph/Node";
import type { ForceGraphMethods } from "react-force-graph-2d";

import { dimensionsAtom, graphSettingsAtom } from "@/atoms/graphAtoms";
import {
  useGraphFiltering,
  useGraphForces,
  useGraphKeyboard,
  useGraphNavigation,
  useGraphOperations,
  useGraphZoom,
} from "@/hooks";
import { Drawing } from "@/views/graph/Drawing";
import { GraphControls } from "@/views/graph/GraphControls";
import { buildTagColorMap } from "@/views/graph/tagColors";
import { TagList, UNTAGGED } from "@/views/graph/TagList";

interface GraphComponentProps {
  data?: Graph;
  getExpandNode: (nodePath: string | undefined) => Promise<Graph>;
  titleFontSize: number;
}

export const ReactForceGraph: React.FC<GraphComponentProps> = ({
  getExpandNode,
  titleFontSize,
}) => {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagCloudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stableTagColors = useRef<Map<string, string>>(new Map());

  const dimensions = useAtomValue(dimensionsAtom);
  const graphSettings = useAtomValue(graphSettingsAtom);

  // Zoom operations
  const { zoomToFitNodes } = useGraphZoom(fgRef);

  // Graph state and operations
  const {
    graphData,
    setGraphData,
    selectedNode,
    navIndexHistory,
    expandNode,
    signalSelectedNode,
    hoverNode,
  } = useGraphOperations({
    getExpandNode,
    zoomToFitNodes,
  });

  // Navigation
  const navigation = useGraphNavigation({
    graphData,
    selectedNode,
    navIndexHistory,
    onSelectNode: signalSelectedNode,
    onExpandNode: expandNode,
  });

  // Keyboard handling
  const { handleKeyDown, handleKeyUp } = useGraphKeyboard(navigation);

  // Distance-based filtering
  const { filteredGraphData, setMaxPathLength } = useGraphFiltering(graphData, selectedNode);

  // Tag filtering
  const [uncheckedTags, setUncheckedTags] = useState<Set<string>>(new Set());
  const [tagColorMode, setTagColorMode] = useState<"edges" | "nodes">("nodes");
  const [tagSearch, setTagSearch] = useState("");
  const [nodeTagVersion, setNodeTagVersion] = useState(0);

  const handleSetTagColorMode = useCallback((mode: "edges" | "nodes") => {
    setTagColorMode(mode);
  }, []);

  const handleNodeTagUpdate = useCallback((nodePath: string, tag: string, add: boolean) => {
    const node = graphData.nodes.find((n) => n.path === nodePath);
    if (!node) return;
    if (add) {
      if (!node.tags.includes(tag)) node.tags = [...node.tags, tag];
    } else {
      node.tags = node.tags.filter((t) => t !== tag);
    }
    setNodeTagVersion((v) => v + 1);
    setGraphData({ nodes: graphData.nodes, links: graphData.links } as Graph);
  }, [graphData, setGraphData]);

  const handleToggleTag = useCallback((tag: string) => {
    setUncheckedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const tagFilteredData = useMemo(() => {
    if (uncheckedTags.size === 0) return filteredGraphData;

    const nodes = filteredGraphData.nodes as Node[];
    const links = filteredGraphData.links as Link[];

    // Nodes that have at least one checked tag (or pass the "untagged" filter)
    const hideUntagged = uncheckedTags.has(UNTAGGED);
    const taggedNodes = new Set<string>();
    for (const node of nodes) {
      if (node.tags.length === 0) {
        if (!hideUntagged) taggedNodes.add(node.path);
      } else if (node.tags.some((t) => !uncheckedTags.has(t))) {
        taggedNodes.add(node.path);
      }
    }

    // Expand: include direct parents and children of tagged nodes
    const passesTagFilter = new Set<string>(taggedNodes);
    for (const link of links) {
      const srcPath = link.source.path;
      const tgtPath = link.target.path;
      if (taggedNodes.has(srcPath)) passesTagFilter.add(tgtPath);
      if (taggedNodes.has(tgtPath)) passesTagFilter.add(srcPath);
    }

    // Always include selected node
    if (selectedNode.selectedPath) {
      passesTagFilter.add(selectedNode.selectedPath);
    }

    // BFS from selected node to keep only connected nodes
    const connected = new Set<string>();
    if (selectedNode.selectedPath && passesTagFilter.has(selectedNode.selectedPath)) {
      const queue = [selectedNode.selectedPath];
      connected.add(selectedNode.selectedPath);
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const link of links) {
          const srcPath = link.source.path;
          const tgtPath = link.target.path;
          if (srcPath === current && passesTagFilter.has(tgtPath) && !connected.has(tgtPath)) {
            connected.add(tgtPath);
            queue.push(tgtPath);
          } else if (tgtPath === current && passesTagFilter.has(srcPath) && !connected.has(srcPath)) {
            connected.add(srcPath);
            queue.push(srcPath);
          }
        }
      }
    }

    const finalNodes = nodes.filter((n) => connected.has(n.path));
    const finalPaths = new Set(finalNodes.map((n) => n.path));
    const finalLinks = links.filter((l) => finalPaths.has(l.source.path) && finalPaths.has(l.target.path));

    return { nodes: finalNodes, links: finalLinks };
  }, [filteredGraphData, uncheckedTags, selectedNode.selectedPath]);

  const handleCloudDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target instanceof HTMLCanvasElement)) return;
    if (tagColorMode !== "nodes") return;
    if (!fgRef.current) return;

    const rect = e.target.getBoundingClientRect();
    const { x: gx, y: gy } = fgRef.current.screen2GraphCoords(
      e.clientX - rect.left,
      e.clientY - rect.top
    );

    const nodes = tagFilteredData.nodes as (Node & Coords & NodeData)[];
    for (const node of nodes) {
      if (node.x === undefined || node.y === undefined) continue;
      const nodeTags = (node.tags ?? []).filter((t) => !uncheckedTags.has(t));
      if (nodeTags.length === 0) continue;

      const nodeHalfDiag = node.nodeDims
        ? Math.hypot(node.nodeDims[0]!, node.nodeDims[1]!) / 2
        : titleFontSize + 12;
      const cloudRadius = nodeHalfDiag * 2;

      const dx = gx - node.x;
      const dy = gy - node.y;
      if (Math.hypot(dx, dy) > cloudRadius) continue;

      const step = (2 * Math.PI) / nodeTags.length;
      const angle = (Math.atan2(dy, dx) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
      const tag = nodeTags[Math.floor(angle / step)];
      if (tag) {
        setTagSearch(tag === UNTAGGED ? "unspecified" : tag);
        // Uncheck all tags except the clicked one
        const allTags = new Set<string>();
        for (const n of filteredGraphData.nodes as Node[]) {
          if (n.tags.length === 0) allTags.add(UNTAGGED);
          else for (const t of n.tags) allTags.add(t);
        }
        allTags.delete(tag);
        setUncheckedTags(allTags);
      }
      break;
    }
  }, [tagColorMode, tagFilteredData.nodes, filteredGraphData.nodes, uncheckedTags, titleFontSize]);

  // Compute tag color map from filtered nodes (same order as TagList's sortedTags)
  const tagColorMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of filteredGraphData.nodes as Node[]) {
      for (const tag of node.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    const sorted: [string, number][] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return buildTagColorMap(sorted, stableTagColors.current);
  }, [filteredGraphData.nodes, nodeTagVersion]);

  // Draw tag clouds + edge guides under all objects (links + nodes) via pre-render hook.
  // All shapes are drawn at full opacity onto an isolated offscreen canvas, then composited
  // at globalAlpha=0.35 — this prevents alpha from accumulating where shapes overlap.
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (tagColorMode !== "nodes") return;

    const allNodes = tagFilteredData.nodes as (Node & Coords & NodeData)[];
    const visibleNodes = allNodes.filter(
      (n) => n.x !== undefined && n.y !== undefined
    );

    const getHalfDiag = (n: Node & Coords & NodeData) =>
      n.nodeDims ? Math.hypot(n.nodeDims[0]!, n.nodeDims[1]!) / 2 : titleFontSize / globalScale + 12;

    // Set up (or reuse) an offscreen canvas matching the main canvas size
    if (!tagCloudCanvasRef.current) {
      tagCloudCanvasRef.current = document.createElement("canvas");
    }
    const oc = tagCloudCanvasRef.current;
    const mainCanvas = ctx.canvas;
    if (mainCanvas.width === 0 || mainCanvas.height === 0) return;
    oc.width = mainCanvas.width;
    oc.height = mainCanvas.height;
    const ocCtx = oc.getContext("2d")!;

    // Replicate the main canvas transform (pan + zoom) so graph coordinates match
    ocCtx.setTransform(ctx.getTransform());

    // Build per-tag node map for edge guides
    const nodeByPath = new Map<string, Node & Coords & NodeData>();
    for (const node of visibleNodes) nodeByPath.set(node.path, node);

    // 1st layer: edge guides only along actual graph edges where both nodes share the tag
    const drawn = new Set<string>();
    for (const link of tagFilteredData.links as Link[]) {
      const a = nodeByPath.get(link.source.path);
      const b = nodeByPath.get(link.target.path);
      if (!a || !b || a.x === undefined || b.x === undefined) continue;

      const pairKey = [a.path, b.path].sort().join("\0");
      if (drawn.has(pairKey)) continue;

      const sharedTags = a.tags.filter(
        (t) => !uncheckedTags.has(t) && b.tags.includes(t)
      );
      for (const tag of sharedTags) {
        const color = tagColorMap.get(tag);
        if (!color) continue;
        const cr = (getHalfDiag(a) + getHalfDiag(b));
        Drawing.drawTagEdge(a.x!, a.y!, b.x!, b.y!, cr, color, ocCtx);
        drawn.add(pairKey);
        break; // one rect per edge (first shared tag wins — clouds show all tags)
      }
    }

    // 2nd layer: node clouds
    for (const node of visibleNodes) {
      Drawing.drawNodeTagCloud(node, ocCtx, getHalfDiag(node), tagColorMap, uncheckedTags);
    }

    // Composite offscreen canvas onto main canvas at reduced opacity.
    // Reset transform first so drawImage uses raw pixel coordinates.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(oc, 0, 0);
    ctx.restore();
  }, [tagColorMode, tagFilteredData.nodes, tagFilteredData.links, tagColorMap, uncheckedTags, titleFontSize]);

  // D3 force configuration
  useGraphForces(fgRef, dimensions, graphData, setGraphData);

  // Focus container for keyboard navigation on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      id="pocket-memory"
      ref={containerRef}
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleCloudDoubleClick}
      tabIndex={0}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={tagFilteredData}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={50}
        onEngineStop={() => zoomToFitNodes(selectedNode.selectedPath, selectedNode.selectedIndex)}
        nodeCanvasObject={(node: Node & Coords & NodeData, ctx, globalScale) =>
          Drawing.drawNode(node, ctx, globalScale, titleFontSize, graphSettings)
        }
        nodePointerAreaPaint={(node: Node & Coords & NodeData, color, ctx): void => {
          ctx.fillStyle = color;
          const bckgDims = node.nodeDims;
          if (!bckgDims || !bckgDims[0] || !bckgDims[1]) return;
          ctx.fillRect(
            node.x - bckgDims[0] / 2,
            node.y - bckgDims[1] / 2,
            bckgDims[0],
            bckgDims[1]
          );
        }}
        onRenderFramePre={handleRenderFramePre}
        linkCanvasObject={(link: Link, ctx, globalScale) =>
          Drawing.drawLink(
            link, ctx, globalScale, navigation.isDescending, graphSettings,
            tagColorMode === "edges" ? tagColorMap : undefined,
            tagColorMode === "edges" ? uncheckedTags : undefined,
          )
        }
        nodeLabel=""
        nodeAutoColorBy="group"
        onNodeClick={expandNode}
        onNodeHover={hoverNode}
      />
      <TagList
        nodes={filteredGraphData.nodes as Node[]}
        links={filteredGraphData.links as Link[]}
        selectedNodePath={selectedNode.selectedPath}
        uncheckedTags={uncheckedTags}
        onToggleTag={handleToggleTag}
        onSetUncheckedTags={setUncheckedTags}
        tagColorMap={tagColorMap}
        tagColorMode={tagColorMode}
        onSetTagColorMode={handleSetTagColorMode}
        search={tagSearch}
        onSearchChange={setTagSearch}
        onNodeTagUpdate={handleNodeTagUpdate}
      />
      <GraphControls
        onPanLeft={navigation.handlePanLeft}
        onPanRight={navigation.handlePanRight}
        onPanUp={navigation.handlePanUp}
        onPanDown={navigation.handlePanDown}
        onDirectionToggle={navigation.handleDirectionToggle}
        isDescending={navigation.isDescending}
        onMaxPathLengthChange={setMaxPathLength}
      />
    </div>
  );
};
