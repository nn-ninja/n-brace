import type { Node } from "@/graph/Node";
import type { MutableRefObject } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";


export function useGraphZoom(fgRef: MutableRefObject<ForceGraphMethods | undefined>) {
  const zoomToFitNodes = (selectedPath: string | undefined, selectedIndex: number | undefined) => {
    if (!fgRef.current) {
      return undefined;
    }

    if (selectedIndex !== undefined) {
      return fgRef.current.zoomToFit(200, 50, (node: Node) => {
        return !!node.links.find(
          (l) => l.source.idx === selectedIndex || l.target.idx === selectedIndex
        );
      });
    }

    if (!selectedPath) {
      return fgRef.current.zoomToFit(200, 50);
    }

    return fgRef.current.zoomToFit(200, 50, (node: Node) => {
      return !!node.links.find(
        (l) => l.source.path === selectedPath || l.target.path === selectedPath
      );
    });
  };

  return { zoomToFitNodes };
}
