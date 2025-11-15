import { useEffect, useState } from "react";

import type { Link } from "@/graph/Link";
import type { Node } from "@/graph/Node";

interface SelectedNode {
  selectedPath?: string;
  selectedIndex?: number;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function useGraphFiltering(graphData: GraphData, selectedNode: SelectedNode) {
  const [maxPathLength, setMaxPathLength] = useState(9);
  const [filteredGraphData, setFilteredGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });

  useEffect(() => {
    if (!selectedNode.selectedIndex || maxPathLength >= 99) {
      setFilteredGraphData(graphData);
      return;
    }

    // BFS to find nodes within maxPathLength
    const distances = new Map<number, number>();
    const queue: number[] = [selectedNode.selectedIndex];
    distances.set(selectedNode.selectedIndex, 0);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentDistance = distances.get(currentId)!;

      if (currentDistance >= maxPathLength) continue;

      // Find neighbors
      graphData.links.forEach((link) => {
        let neighborId: number | undefined;
        if (link.source.idx === currentId && !distances.has(link.target.idx)) {
          link.distance = currentDistance;
          neighborId = link.target.idx;
        } else if (link.target.idx === currentId && !distances.has(link.source.idx)) {
          link.distance = currentDistance;
          neighborId = link.source.idx;
        }

        if (neighborId !== undefined) {
          distances.set(neighborId, currentDistance + 1);
          queue.push(neighborId);
        }
      });
    }

    // Filter nodes within maxPathLength
    const validNodeIds = new Set(distances.keys());
    const filteredNodes = graphData.nodes.filter((node) => validNodeIds.has(node.idx));
    const filteredLinks = graphData.links.filter(
      (link) => validNodeIds.has(link.source.idx) && validNodeIds.has(link.target.idx)
    );

    const anyChange =
      filteredGraphData.nodes.length !== validNodeIds.size ||
      !filteredGraphData.nodes.every((n: Node) => validNodeIds.has(n.idx));

    if (anyChange) {
      setFilteredGraphData({ nodes: filteredNodes, links: filteredLinks });
    }
  }, [selectedNode, maxPathLength, graphData]);

  return { filteredGraphData, maxPathLength, setMaxPathLength };
}
