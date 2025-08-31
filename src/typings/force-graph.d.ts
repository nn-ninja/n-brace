/**
 * the Coords type in force-graph
 */
type Coords = {
  x: number;
  y: number;
};

 CoordNode = Node & Coords;

type NodeData = {
  index: number;
  nodeDims: number[];
}
