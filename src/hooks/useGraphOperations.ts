import { useAtom } from "jotai/react";
import { useEffect } from "react";

import type { Graph } from "@/graph/Graph";
import type { Node } from "@/graph/Node";

import {
  expandNodePathAtom,
  graphDataAtom,
  graphNavAtom,
  navIndexHistoryAtom,
  nodeIdxMaxAtom,
} from "@/atoms/graphAtoms";
import { stackOnIndexHistory } from "@/atoms/graphOps";
import { Link } from "@/graph/Link";
import { eventBus } from "@/util/EventBus";

interface UseGraphOperationsProps {
  getExpandNode: (nodePath: string | undefined) => Promise<Graph>;
  zoomToFitNodes: (selectedPath: string | undefined, selectedIndex: number | undefined) => void;
}

export function useGraphOperations({
  getExpandNode,
  zoomToFitNodes,
}: UseGraphOperationsProps) {
  const [nodeIdxMax, setNodeIdxMax] = useAtom(nodeIdxMaxAtom);
  const [selectedNode, setSelectedNode] = useAtom(graphNavAtom);
  const [expandNodePath, setExpandNodePath] = useAtom(expandNodePathAtom);
  const [navIndexHistory, setNavIndexHistory] = useAtom(navIndexHistoryAtom);
  const [graphData, setGraphData] = useAtom(graphDataAtom);

  const assignIdx = (nodes: Node[]) => {
    let maxIdx = nodeIdxMax;
    nodes.forEach((n) => {
      n.idx = maxIdx++;
      console.debug(`Node ${n.path} idx = ${n.idx}`);
    });
    setNodeIdxMax(maxIdx);
    return nodes;
  };

  const signalSelectedNode = (node: Node) => {
    if (!node) {
      console.debug("Signal undefined node selected!!!");
      return;
    }

    setSelectedNode({ selectedPath: node.path, selectedIndex: node.idx });

    if (selectedNode.selectedIndex !== undefined) {
      const newIndexHistory = stackOnIndexHistory(
        navIndexHistory,
        graphData.nodes.find((n) => n.idx === selectedNode.selectedIndex)!,
        node
      );
      setNavIndexHistory(newIndexHistory);
    }

    zoomToFitNodes(node.path, node.idx);
    eventBus.trigger("open-file", node.path);
  };

  const expandNodeOp = async (nodePath: string | undefined, nodeIndex: number | undefined) => {
    const { nodes, links } = await getExpandNode(nodePath);
    const expandedNode: Node & NodeData = graphData.nodes.find((n) =>
      nodeIndex ? n.idx === nodeIndex : n.path === nodePath
    ) as Node & NodeData;

    if (!expandedNode) {
      // When opening file totally out of visible graph scope
      setGraphData({ nodes: assignIdx(nodes), links: links } as Graph);
      signalSelectedNode(
        nodes.find((n) => (nodeIndex ? n.idx === nodeIndex : n.path === nodePath)) as Node
      );
      return;
    }

    const nodeDuplicates = new Set<string>();
    const newLinks = links.filter((l) => {
      const exists = graphData.links.find((existingLink) => {
        return (
          (existingLink.source.idx === expandedNode.idx ||
            existingLink.target.idx === expandedNode.idx) &&
          Link.compare(l, existingLink)
        );
      });
      if (exists) {
        nodeDuplicates.add(l.source.path);
        nodeDuplicates.add(l.target.path);
      }
      return !exists;
    });

    const newNodes = nodes.filter((n) => {
      const isItExpanded = n.path === expandedNode.path;
      if (isItExpanded) {
        const existingNode = expandedNode;
        links.forEach((l) => {
          if (l.source.path === existingNode.path) {
            l.source = existingNode as Node & NodeData & Coords;
          } else if (l.target.path === existingNode.path) {
            l.target = existingNode as Node & NodeData & Coords;
          }
        });
        existingNode.links = [
          ...existingNode.links,
          ...n.links.filter(
            (l) =>
              !existingNode.links.find(
                (existingLink) =>
                  l.source.path === existingLink.source.path &&
                  l.target.path === existingLink.target.path
              )
          ),
        ];
        return false;
      }
      return !nodeDuplicates.has(n.path);
    });

    graphData.nodes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    setGraphData({
      nodes: [...graphData.nodes, ...assignIdx(newNodes)],
      links: [...graphData.links, ...newLinks],
    } as Graph);

    signalSelectedNode(expandedNode);
    console.debug(
      `New graph data after expansion: ${graphData.nodes.length + newNodes.length} nodes and ${graphData.links.length + newLinks.length} links`
    );
  };

  const expandNode = (node: Node) => {
    if (node.expanded) {
      signalSelectedNode(node);
      return;
    }
    expandNodeOp(node.path, node.idx);
    node.expanded = true;
  };

  const hoverNode = (node: Node) => {
    if (!node) return;

    const { min, max } = graphData.nodes.reduce(
      (acc, n) => {
        const value = n.zIndex ?? Infinity;
        return {
          min: Math.min(acc.min, value),
          max: Math.max(acc.max, n.zIndex ?? -Infinity),
        };
      },
      { min: Infinity, max: -Infinity }
    );
    node.toggle(min, max);
    graphData.nodes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  };

  // Update node labels based on selection
  useEffect(() => {
    graphData.nodes.forEach((node) => {
      node.selected = node.path === selectedNode.selectedPath;
    });
    graphData.links.forEach((link) => {
      if (link.target.path === selectedNode.selectedPath) {
        link.label = "parent";
        link.source.label = "parent";
      } else if (link.source.path === selectedNode.selectedPath) {
        link.label = "child";
        link.target.label = "child";
      } else {
        link.label = undefined;
      }
    });
  }, [selectedNode]);

  // Handle expand node path from external trigger
  useEffect(() => {
    if (expandNodePath) {
      expandNodeOp(expandNodePath, undefined).then(() => {
        setExpandNodePath(undefined);
      });
    }
  }, [expandNodePath]);

  return {
    graphData,
    setGraphData,
    selectedNode,
    navIndexHistory,
    assignIdx,
    expandNode,
    signalSelectedNode,
    hoverNode,
  };
}
