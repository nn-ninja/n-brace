import { useState } from "react";

import type { GraphData } from "./useGraphFiltering";
import type { NavIndexHistory } from "@/atoms/graphAtoms";
import type { Node } from "@/graph/Node";

import { calcNodeAngle, getNavIndexBackward, getNavIndexForward } from "@/atoms/graphOps";

interface SelectedNode {
  selectedPath?: string;
  selectedIndex?: number;
}

interface UseGraphNavigationProps {
  graphData: GraphData;
  selectedNode: SelectedNode;
  navIndexHistory: NavIndexHistory;
  onSelectNode: (node: Node) => void;
  onExpandNode: (node: Node) => void;
}

export function useGraphNavigation({
  graphData,
  selectedNode,
  navIndexHistory,
  onSelectNode,
  onExpandNode,
}: UseGraphNavigationProps) {
  const [isDescending, setIsDescending] = useState(true);

  const getSelectedNodeObj = (): (Node & Coords) | undefined => {
    if (selectedNode.selectedIndex !== undefined) {
      return graphData.nodes.find((n) => n.idx === selectedNode.selectedIndex) as Node & Coords;
    }
    if (selectedNode.selectedPath) {
      return graphData.nodes.find((n) => n.path === selectedNode.selectedPath) as Node & Coords;
    }
    return undefined;
  };

  const handleDirectionToggle = () => {
    setIsDescending(!isDescending);
  };

  const handlePanRightLeft = (clockwise: boolean, lookChildSiblings: boolean) => {
    const node = getSelectedNodeObj();
    if (!node) return;

    const relIndex = lookChildSiblings
      ? getNavIndexBackward(navIndexHistory, node)
      : getNavIndexForward(navIndexHistory, node);

    if (relIndex === undefined) return;

    const rel = graphData.nodes.find((n) => n.idx === relIndex) as Node & Coords;

    const siblings = lookChildSiblings
      ? rel.links
          .filter((l) => l.source.idx === relIndex && l.target.idx !== node.idx)
          .map((l) => l.target)
      : rel.links
          .filter((l) => l.target.idx === relIndex && l.source.idx !== node.idx)
          .map((l) => l.source);

    if (!siblings.length) return;

    const nodeAngle = calcNodeAngle(rel, node);

    const angles = siblings.map((sibling) => {
      const angle = calcNodeAngle(rel, sibling);
      const angleDiff = (360 - nodeAngle + angle) % 360;
      return { n: sibling, angle: angleDiff };
    });

    const closest = angles.reduce((best, angle) => {
      return (best.angle < angle.angle && clockwise) || (best.angle > angle.angle && !clockwise)
        ? best
        : angle;
    });

    onSelectNode(closest.n);
  };

  const handlePanUpDown = (dirDescend: boolean) => {
    const node = getSelectedNodeObj();
    if (!node) return;

    const nextInLine = dirDescend
      ? getNavIndexForward(navIndexHistory, node)
      : getNavIndexBackward(navIndexHistory, node);

    if (nextInLine === undefined) {
      if (!node.expanded) {
        onExpandNode(node);
      }
      return;
    }

    const targetNode = graphData.nodes.find((n) => n.idx === nextInLine) as Node;
    onSelectNode(targetNode);
  };

  const handlePanRight = () => handlePanRightLeft(true, isDescending);
  const handlePanLeft = () => handlePanRightLeft(false, isDescending);
  const handlePanUp = () => handlePanUpDown(isDescending);
  const handlePanDown = () => handlePanUpDown(!isDescending);

  return {
    isDescending,
    handlePanUp,
    handlePanDown,
    handlePanLeft,
    handlePanRight,
    handleDirectionToggle,
  };
}
