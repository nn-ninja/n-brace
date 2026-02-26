import * as d3 from "d3";
import { useEffect } from "react";

import type { GraphData } from "./useGraphFiltering";
import type { Graph } from "@/graph/Graph";
import type { MutableRefObject } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";


interface Dimensions {
  width: number;
  height: number;
}

export function useGraphForces(
  fgRef: MutableRefObject<ForceGraphMethods | undefined>,
  dimensions: Dimensions,
  graphData: GraphData,
  setGraphData: (graph: Graph) => void
) {
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    console.debug("Setting Graph forces");

    fg.d3Force("collide", d3.forceCollide(12));
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
  }, [dimensions]);
}
