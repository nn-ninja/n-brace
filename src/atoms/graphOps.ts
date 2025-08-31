import type { Node } from "@/graph/Node";
import type { NavHistory, NavIndexHistory } from "@/atoms/graphAtoms";

export const stackOnHistory = (navHistory: NavHistory, soFarSelected: Node, newSelected: Node) => {
  if (!soFarSelected) {
    return navHistory;
  }

  const shortPaths = getShortestPath(soFarSelected, newSelected);
  if (!shortPaths || shortPaths.length <= 1) {
    return navHistory;
  }
  // console.log(`SHORTPATH: ${shortPaths.map((n) => n.path)}`);

  for (const nodePair of consecutivePairs(shortPaths)) {
    if (nodePair[0].isChildOf(nodePair[1].path)) {
      navHistory.backward[nodePair[0].path] = nodePair[1].path;
      navHistory.forward[nodePair[1].path] = nodePair[0].path;
    }
  }

  return navHistory;
};

export const stackOnIndexHistory = (
  navHistory: NavIndexHistory,
  soFarSelected: Node,
  newSelected: Node
) => {
  if (!soFarSelected) {
    return navHistory;
  }

  const shortPaths = getShortestPath(soFarSelected, newSelected);
  if (!shortPaths || shortPaths.length <= 1) {
    return navHistory;
  }

  for (const nodePair of consecutivePairs(shortPaths)) {
    if (nodePair[0].isChildOf(nodePair[1].path)) {
      navHistory.backward[nodePair[0].idx] = nodePair[1].idx;
      navHistory.forward[nodePair[1].idx] = nodePair[0].idx;
    }
  }

  return navHistory;
};

export const getNavBackward = (navHistory: NavHistory, node: Node): string | undefined => {
  function getFirstParent() {
    const firstParent = node.links.find((l) => l.target.path === node.path);
    if (firstParent) {
      return firstParent.source.path;
    }
    return undefined;
  }

  return navHistory.backward[node.path] ?? getFirstParent();
};

export const getNavIndexBackward = (
  navHistory: NavIndexHistory,
  node: Node
): number | undefined => {
  function getFirstParent() {
    const firstParent = node.links.find((l) => l.target.idx === node.idx);
    if (firstParent) {
      return firstParent.source.idx;
    }
    return undefined;
  }

  return navHistory.backward[node.idx] ?? getFirstParent();
};

export const getNavForward = (navHistory: NavHistory, node: Node): string | undefined => {
  function getFirstChild() {
    const firstChild = node.links.find((l) => l.source.path === node.path);
    if (firstChild) {
      return firstChild.target.path;
    }
    return undefined;
  }

  return navHistory.forward[node.path] ?? getFirstChild();
};

export const getNavIndexForward = (navHistory: NavIndexHistory, node: Node): number | undefined => {
  function getFirstChild() {
    const firstChild = node.links.find((l) => l.source.idx === node.idx);
    if (firstChild) {
      return firstChild.target.idx;
    }
    return undefined;
  }

  return navHistory.forward[node.idx] ?? getFirstChild();
};

const consecutivePairs = <T>(arr: T[]): [T, T][] =>
  arr.slice(0, -1).map((item, index) => [item, arr[index + 1]!]);

const getShortestPath = (node1: Node, node2: Node) => {
  const visited = new Set<Node>();
  const queue = [{ node: node1, path: [node1] }];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    // If this node is the destination, return the path we took to get here
    if (node === node2) {
      return path;
    }

    visited.add(node);

    // Go through all neighbors of the current node
    for (const neighbor of node.links.map((l) =>
      l.source.path === node.path ? l.target : l.source
    )) {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  // no path
  return null;
};

export const calcNodeAngle = (parent: Coords, node: Coords) => {
  return ((Math.PI + Math.atan2(-node.x + parent.x, node.y - parent.y)) * 180) / Math.PI;
};
