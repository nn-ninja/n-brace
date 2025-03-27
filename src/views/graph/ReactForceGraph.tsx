import React, { useContext, useEffect, useRef } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";
import ForceGraph2D from "react-force-graph-2d";
import type { Graph } from "@/graph/Graph";
import { Drawing } from "@/views/graph/Drawing";
import { Node } from "@/graph/Node";
import type { ReactForceGraphView } from "@/views/ReactForceGraphView";
import { ViewContext } from "@/views/ReactForceGraphView";
import { useAtom, useAtomValue } from "jotai/react";
import { useResetAtom } from "jotai/utils";
import { dimensionsAtom, graphDataAtom, graphNavAtom } from "@/atoms/graphAtoms";
import * as d3 from "d3";
import { Link } from "@/graph/Link";

interface GraphComponentProps {
  data: Graph;
  getInitialGraph: () => Promise<Graph>;
  getExpandNode: () => Promise<Graph>;
  titleFontSize: number;
}

export const useView = (): ReactForceGraphView | undefined => {
  return useContext(ViewContext);
};

const ReactForceGraph: React.FC<GraphComponentProps> = ({
  getInitialGraph,
  getExpandNode,
  titleFontSize,
}) => {
  const isFirstRun = useRef(true);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  const dimensions = useAtomValue(dimensionsAtom);
  const [selectedNode, setSelectedNode] = useAtom(graphNavAtom);
  const resetSelectedNode = useResetAtom(graphNavAtom);
  const [graphData, setGraphData] = useAtom(graphDataAtom);

  // directional forces depending on if a screen is vertical or horizontal
  useEffect(() => {
    const fg = fgRef.current;
    // TODO change forces only if dimensions changed a lot
    if (fg) {
      console.info("Setting Graph forces");
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
      fg.d3Force("x", d3.forceX(dimensions.width / 2).strength((1/ratio > 1 ? 1/ratio : 0) * dir_power));
      fg.d3Force("y", d3.forceY(dimensions.height / 2).strength((ratio > 1 ? ratio : 0) * dir_power));

      setGraphData({
        nodes: [...graphData.nodes],
        links: [...graphData.links],
      });
    }
  }, [dimensions]);

  useEffect(() => {
    const fg = fgRef.current;

    const initGraph = async () => {
      const graph = await getInitialGraph();
      console.info("Init Graph data");
      setGraphData(graph);
      resetSelectedNode();
    };
    initGraph();
  }, [getInitialGraph, setGraphData]);

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

  function updateAttributeDeep<T extends object, K extends keyof T>(
    original: T,
    key: K,
    newValue: T[K]
  ): T {
    const deepCopy = structuredClone(original); // Deep copy
    deepCopy[key] = newValue; // Update the attribute
    return deepCopy;
  }

  function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const matches = array.filter(predicate);
    const nonMatches = array.filter(item => !predicate(item));
    return [matches, nonMatches];
  }

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

  const expandNode = async (node: Node) => {
    const { nodes, links } = await getExpandNode(node);
    const expandedNode = graphData.nodes.find((n) => n.path === node.path);
    if (!expandedNode) {
      return;
    }

    // const [newNodes, existingNodes] = partition(nodes, (n) => {
    //   return !graphData.nodes.find((existingNode) => {
    //     return Node.compare(n, existingNode);
    //   });
    // });
    const newNodes = nodes.filter((n) => {
      return !graphData.nodes.find((existingNode) => {
        const exists = Node.compare(n, existingNode);
        if (exists) {
          links.forEach((l) => {
            if (l.source.path === existingNode.path) {
              l.source = existingNode;
            } else if (l.target.path === existingNode.path) {
              l.target = existingNode;
            }
          });
          existingNode.links = n.links;
        }
        return exists;
      });
    });
    const newLinks = links.filter((l) => {
      return !graphData.links.find((existingLink) => {
        return Link.compare(l, existingLink);
      });
    });
    // newLinks
    // .filter((l) => l.source.path == expandedNode.path)
    // .forEach((l) => {
    //   if (l.source.)
    //   l.source = expandedNode;
    // });

    setSelectedNode({ selectedPath: node.path });

    graphData.nodes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    console.info("Expand Setting Graph data");
    setGraphData({
      nodes: [...graphData.nodes, ...newNodes],
      links: [...graphData.links, ...newLinks],
    });

    zoomToFitNodes(node.path);

    console.log(`New graph data after expansion: ${graphData.nodes.length} nodes and ${graphData.links.length} links`);
  };

  const zoomToFitNodes = (selectedPath: string | undefined) => {
    if (fgRef.current) {
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

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={dimensions.width}
      height={dimensions.height}
      cooldownTicks={50}
      onEngineStop={() => zoomToFitNodes(selectedNode.selectedPath)}
      nodeCanvasObject={(node: Node & Coords & NodeData, ctx, globalScale) =>
        Drawing.drawNode(node, ctx, globalScale, titleFontSize)
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
      linkCanvasObject={(link: Link, ctx, globalScale) => Drawing.drawLink(link, ctx, globalScale)}
      nodeLabel="name"
      nodeAutoColorBy="group"
      linkDirectionalParticles={4}
      linkDirectionalParticleColor={"rgba(71, 30, 143, 0.25)"}
      onNodeClick={expandNode}
      onNodeHover={hoverNode}
      onLinkClick={(link) => alert(`Clicked link: ${link.source.name} -> ${link.target.name}`)}
    />
  );
};

export default ReactForceGraph;
