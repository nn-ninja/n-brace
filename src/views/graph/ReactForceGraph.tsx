import { useAtomValue } from "jotai/react";
import React, { useEffect, useRef } from "react";
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

interface GraphComponentProps {
  data?: Graph;
  getInitialGraph: () => Promise<Graph>;
  getExpandNode: (nodePath: string | undefined) => Promise<Graph>;
  implodeNode: (nodePath: string | undefined) => Promise<Graph>;
  titleFontSize: number;
}

export const ReactForceGraph: React.FC<GraphComponentProps> = ({
  getInitialGraph,
  getExpandNode,
  implodeNode,
  titleFontSize,
}) => {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

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
    assignIdx,
    expandNode,
    signalSelectedNode,
    handleImplode,
    hoverNode,
  } = useGraphOperations({
    getExpandNode,
    implodeNode,
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

  // D3 force configuration
  useGraphForces(fgRef, dimensions, graphData, setGraphData);

  // Initialize graph on mount
  useEffect(() => {
    const initGraph = async () => {
      const graph = await getInitialGraph();
      console.debug(`Init Graph data starting with ${graph.rootPath}`);
      assignIdx(graph.nodes);
      setGraphData(graph);
    };
    initGraph();

    // Focus container for keyboard navigation
    containerRef.current?.focus();
  }, []);

  return (
    <div
      id="pocket-memory"
      ref={containerRef}
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={filteredGraphData}
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
        linkCanvasObject={(link: Link, ctx, globalScale) =>
          Drawing.drawLink(link, ctx, globalScale, navigation.isDescending, graphSettings)
        }
        nodeLabel="name"
        nodeAutoColorBy="group"
        onNodeClick={expandNode}
        onNodeHover={hoverNode}
      />
      <GraphControls
        onPanLeft={navigation.handlePanLeft}
        onPanRight={navigation.handlePanRight}
        onPanUp={navigation.handlePanUp}
        onPanDown={navigation.handlePanDown}
        onDirectionToggle={navigation.handleDirectionToggle}
        isDescending={navigation.isDescending}
        onMaxPathLengthChange={setMaxPathLength}
        onImplode={handleImplode}
      />
    </div>
  );
};
