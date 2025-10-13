import type { KeyboardEvent } from "react";
import React, { useEffect, useRef, useState } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";
import ForceGraph2D from "react-force-graph-2d";
import type { Graph } from "@/graph/Graph";
import { Drawing } from "@/views/graph/Drawing";
import { Node } from "@/graph/Node";
import { useAtom, useAtomValue } from "jotai/react";
import {
  dimensionsAtom,
  expandNodePathAtom,
  graphDataAtom,
  graphNavAtom,
  graphSettingsAtom,
  navHistoryAtom,
  navIndexHistoryAtom,
  nodeIdxMaxAtom,
} from "@/atoms/graphAtoms";
import * as d3 from "d3";
import { Link } from "@/graph/Link";
import { eventBus } from "@/util/EventBus";
import { GraphControls } from "@/views/graph/GraphControls";
import {
  calcNodeAngle,
  getNavIndexBackward,
  getNavIndexForward,
  stackOnHistory,
  stackOnIndexHistory,
} from "@/atoms/graphOps";

interface GraphComponentProps {
  data?: Graph;
  getInitialGraph: () => Promise<Graph>;
  getExpandNode: (nodePath: string | undefined) => Promise<Graph>;
  titleFontSize: number;
}

export const ReactForceGraph: React.FC<GraphComponentProps> = ({
  getInitialGraph,
  getExpandNode,
  titleFontSize,
}) => {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodeIdxMax, setNodeIdxMax] = useAtom(nodeIdxMaxAtom);
  const graphSettings = useAtomValue(graphSettingsAtom);
  // whether the graph exploration parent->child directed
  const [isDescending, setIsDescending] = useState(true);
  const [maxPathLength, setMaxPathLength] = useState(9);
  const changedDescendingDuringCtrl = useRef(false);

  const dimensions = useAtomValue(dimensionsAtom);
  const [selectedNode, setSelectedNode] = useAtom(graphNavAtom);
  const [expandNodePath, setExpandNodePath] = useAtom(expandNodePathAtom);
  const [navHistory, setNavHistory] = useAtom(navHistoryAtom);
  const [navIndexHistory, setNavIndexHistory] = useAtom(navIndexHistoryAtom);
  const [graphData, setGraphData] = useAtom(graphDataAtom);
  const [filteredGraphData, setFilteredGraphData] = useState<{
    nodes: Node[];
    links: Link[];
  }>({ nodes: [], links: [] });

  function assignIdx(nodes: Node[]) {
    let maxIdx = nodeIdxMax;
    nodes.forEach((n) => {
      n.idx = maxIdx++;
      console.debug(`Node ${n.path} idx = ${n.idx}`);
    });
    setNodeIdxMax(maxIdx);
    return nodes;
  }

  useEffect(() => {
    const initGraph = async () => {
      const graph = await getInitialGraph();
      console.debug(`Init Graph data starting with ${graph.rootPath}`);
      assignIdx(graph.nodes);
      setGraphData(graph);
      setSelectedNode({ selectedPath: graph.rootPath });
    };
    initGraph();

    // navigation will be instantly ready
    containerRef.current?.focus();
  }, []);

  // directional forces depending on if a screen is vertical or horizontal
  useEffect(() => {
    const fg = fgRef.current;
    // TODO optimize: change forces only if dimensions changed many times
    if (fg) {
      console.debug("Setting Graph forces");
      // fg.d3Force("link", d3.forceLink()
      // .strength((link) => {
      //   return 1 / Math.min(link.target.inlinkCount, link.source.outlinkCount);
      // })
      // .distance((link) => {
      //     return Math.max(
      //       30,
      //       6 * Math.min(10, link.source.outlinkCount) + 1.8 * Math.min(10, link.target.outlinkCount)
      //     );
      // })
      // );
      fg.d3Force("collide", d3.forceCollide(12));
      // fg.d3Force("collide", d3.forceCollide((node: NodeData) => {
      //     return Math.max(node.nodeDims) / 2;
      //   })
      // );
      fg.d3Force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2));
      const ratio = dimensions.width / dimensions.height;
      console.debug("change to ratio Y " + ratio);
      const dir_power = 0.03;
      fg.d3Force(
        "x",
        d3.forceX(dimensions.width / 2).strength((1 / ratio > 1 ? 1 / ratio : 0) * dir_power)
      );
      fg.d3Force(
        "y",
        d3.forceY(dimensions.height / 2).strength((ratio > 1 ? ratio : 0) * dir_power)
      );

      setGraphData({
        nodes: [...graphData.nodes],
        links: [...graphData.links],
      } as Graph);
    }
  }, [dimensions]);

  useEffect(() => {
    if (!selectedNode.selectedIndex || maxPathLength >= 99) {
      setFilteredGraphData(graphData); // Show all if no selection or max
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

    setFilteredGraphData({ nodes: filteredNodes, links: filteredLinks });
  }, [selectedNode, maxPathLength, graphData]);

  useEffect(() => {
    graphData.nodes.forEach((node) => {
      if (node.path === selectedNode.selectedPath) {
        node.label = "selected";
      } else {
        node.label = undefined;
      }
    });
    graphData.links.forEach((link) => {
      if (link.target.path === selectedNode.selectedPath) {
        link.label = "parent";
        link.source.label = "parent";
      } else if (link.source.path == selectedNode.selectedPath) {
        link.label = "child";
        link.target.label = "child";
      } else {
        link.label = undefined;
      }
    });
  }, [selectedNode]);

  useEffect(() => {
    if (expandNodePath) {
      expandNodeOp(expandNodePath, undefined).then(() => {
        setExpandNodePath(undefined);
      });
    }
  }, [expandNodePath]);

  const expandNode = (node: Node) => {
    if (!node.expanded) {
      expandNodeOp(node.path, node.idx);
      node.expanded = true;
    } else {
      signalSelectedNode(node);
    }
  };

  const expandNodeOp = async (nodePath: string | undefined, nodeIndex: number | undefined) => {
    const fullConns = false;

    const { nodes, links } = await getExpandNode(nodePath);
    const expandedNode: Node & NodeData = graphData.nodes.find((n) =>
      nodeIndex ? n.idx === nodeIndex : n.path === nodePath
    ) as Node & NodeData;
    if (!expandedNode) {
      // when opening file totally ouf of visible graph scope
      setGraphData({ nodes: assignIdx(nodes), links: links } as Graph);
      signalSelectedNode(
        nodes.find((n) => (nodeIndex ? n.idx === nodeIndex : n.path === nodePath)) as Node
      );
      return;
    }

    let newNodes;
    let newLinks;
    if (fullConns) {
      newNodes = nodes.filter((n) => {
        return !graphData.nodes.find((existingNode) => {
          const exists = Node.compare(n, existingNode);
          if (exists) {
            links.forEach((l) => {
              if (l.source.path === existingNode.path) {
                l.source = existingNode as Node & Coords;
              } else if (l.target.path === existingNode.path) {
                l.target = existingNode as Node & Coords;
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
          }
          return exists;
        });
      });
      newLinks = links.filter((l) => {
        return !graphData.links.find((existingLink) => {
          return Link.compare(l, existingLink);
        });
      });
    } else {
      const nodeDuplicates = new Set<string>();
      newLinks = links.filter((l) => {
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
      newNodes = nodes.filter((n) => {
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
    }

    graphData.nodes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    //// debug code
    // const simplifiedNodes = [...graphData.nodes, ...newNodes].map(node => ({
    //   path: node.path,
    //   links: node.links.map((link) => link.source.path + "->" + link.target.path),
    // }));
    // console.debug(`Nodes after expand: ${JSON.stringify(simplifiedNodes)}`);

    setGraphData({
      nodes: [...graphData.nodes, ...assignIdx(newNodes)],
      links: [...graphData.links, ...newLinks],
    } as Graph);

    signalSelectedNode(expandedNode);
    console.debug(`New graph data after expansion: ${graphData.nodes.length + newNodes.length} 
      nodes and ${graphData.links.length + newLinks.length} links`);
  };

  const signalSelectedNode = (node: Node) => {
    if (!node) {
      console.debug("Signal undefined node selected!!!");
      return;
    }
    setSelectedNode({ selectedPath: node.path, selectedIndex: node.idx });
    const newHistory = stackOnHistory(
      navHistory,
      graphData.nodes.find((n) => n.path === selectedNode.selectedPath) as Node,
      node
    );
    setNavHistory(newHistory);
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

  const hoverNode = (node: Node) => {
    if (!node) {
      return;
    }
    const { min, max } = graphData.nodes.reduce(
      (acc, node) => {
        const value = node.zIndex ?? Infinity; // Treat undefined as Infinity for min
        return {
          min: Math.min(acc.min, value),
          max: Math.max(acc.max, node.zIndex ?? -Infinity), // Treat undefined as -Infinity for max
        };
      },
      { min: Infinity, max: -Infinity }
    );
    node.toggle(min, max);
    graphData.nodes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  };

  const zoomToFitNodes = (selectedPath: string | undefined, selectedIndex: number | undefined) => {
    if (fgRef.current) {
      if (selectedIndex !== undefined) {
        return fgRef.current.zoomToFit(200, 50, (node: Node) => {
          const res = !!node.links.find(
            (l) => l.source.idx === selectedIndex || l.target.idx === selectedIndex
          );
          return res;
        });
      }
      if (!selectedPath) {
        return fgRef.current.zoomToFit(200, 50);
      }
      return fgRef.current.zoomToFit(200, 50, (node: Node) => {
        const res = !!node.links.find(
          (l) => l.source.path === selectedPath || l.target.path === selectedPath
        );
        return res;
      });
    }
  };

  const handlePanRight = () => handlePanRightLeftByIndex(true, isDescending);
  const handlePanLeft = () => handlePanRightLeftByIndex(false, isDescending);
  const handlePanRightLeftByIndex = (clockwise: boolean, lookChildSiblings: boolean) => {
    let node: Node & Coords;
    if (selectedNode.selectedIndex !== undefined) {
      node = graphData.nodes.find((n) => n.idx === selectedNode.selectedIndex) as Node & Coords;
    } else {
      if (!selectedNode.selectedPath) {
        return;
      }
      node = graphData.nodes.find((n) => n.path === selectedNode.selectedPath) as Node & Coords;
    }

    const relIndex = lookChildSiblings
      ? getNavIndexBackward(navIndexHistory, node)
      : getNavIndexForward(navIndexHistory, node);
    if (relIndex === undefined) {
      return;
    }
    const rel: Node & Coords = graphData.nodes.find((n) => n.idx === relIndex) as Node & Coords;

    const siblings = lookChildSiblings
      ? rel.links
          .filter((l) => l.source.idx === relIndex && l.target.idx !== node.idx)
          .map((l) => l.target)
      : rel.links
          .filter((l) => l.target.idx === relIndex && l.source.idx !== node.idx)
          .map((l) => l.source);
    if (!siblings.length) {
      return;
    }

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

    signalSelectedNode(closest.n);
  };
  const handlePanUp = () => handlePanUpDownByIndex(isDescending);
  const handlePanDown = () => handlePanUpDownByIndex(!isDescending);
  const handleDirectionToggle = () => {
    setIsDescending(!isDescending);
  };
  const handlePanUpDownByIndex = (dirDescend: boolean) => {
    let node: Node;
    if (selectedNode.selectedIndex !== undefined) {
      node = graphData.nodes.find((n) => n.idx === selectedNode.selectedIndex) as Node;
    } else {
      if (!selectedNode.selectedPath) {
        return;
      }
      node = graphData.nodes.find((n) => n.path === selectedNode.selectedPath) as Node;
    }

    const nextInLine = dirDescend
      ? getNavIndexForward(navIndexHistory, node)
      : getNavIndexBackward(navIndexHistory, node);
    if (nextInLine === undefined) {
      if (!node?.expanded) {
        expandNode(node);
      }
      return;
    }
    const parent: Node = graphData.nodes.find((n) => n.idx === nextInLine) as Node;
    signalSelectedNode(parent);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Control":
        handleDirectionToggle();
        event.preventDefault();
        break;
      case "ArrowUp":
        handlePanUp();
        event.preventDefault(); // Prevent scrolling
        break;
      case "ArrowDown":
        handlePanDown();
        event.preventDefault();
        break;
      case "ArrowLeft":
        handlePanLeft();
        event.preventDefault();
        break;
      case "ArrowRight":
        handlePanRight();
        event.preventDefault();
        break;
      default:
        break;
    }
    if (event.ctrlKey) {
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          changedDescendingDuringCtrl.current = true;
          break;
        default:
          break;
      }
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (changedDescendingDuringCtrl.current) {
      switch (event.key) {
        case "Control":
          changedDescendingDuringCtrl.current = false;
          handleDirectionToggle();
          event.preventDefault();
          break;
        default:
          break;
      }
    }
  };

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
        nodePointerAreaPaint={(node: Node & Coords & NodeData, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.nodeDims;
          bckgDimensions &&
            bckgDimensions[0] &&
            bckgDimensions[1] &&
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );
        }}
        linkCanvasObject={(link: Link, ctx, globalScale) =>
          Drawing.drawLink(link, ctx, globalScale, isDescending, graphSettings)
        }
        nodeLabel="name"
        nodeAutoColorBy="group"
        // linkDirectionalParticles={4}
        // linkDirectionalParticleSpeed={0.01}
        // linkDirectionalParticleColor={"rgba(r, g, b, 0.25)"}
        onNodeClick={expandNode}
        onNodeHover={hoverNode}
        // onLinkClick={(link) => }
      />
      <GraphControls
        onPanLeft={handlePanLeft}
        onPanRight={handlePanRight}
        onPanUp={handlePanUp}
        onPanDown={handlePanDown}
        onDirectionToggle={handleDirectionToggle}
        isDescending={isDescending}
        onMaxPathLengthChange={setMaxPathLength}
      />
    </div>
  );
};
