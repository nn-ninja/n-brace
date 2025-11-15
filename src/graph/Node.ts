import type { SectionData } from "@/views/graph/fileGraphMethods";
import type { TAbstractFile } from "obsidian";

import { type Link } from "@/graph/Link";

export type ElemType = "note" | "para";

export class Node {
  public readonly id: string;
  public readonly name: string;
  public readonly path: string;
  public readonly val: number; // = weight, currently = 1 because scaling doesn't work well
  public readonly unresolved: boolean;

  public idx: number;
  public readonly neighbors: Node[];
  // public readonly parents: Node[];
  public inlinkCount: number;
  public outlinkCount: number;
  public links: Link[];
  public labelEl: HTMLDivElement | null = null;
  public imagePath?: string;
  public image?: ImageBitmap;
  public zIndex: number = 10;
  public type: ElemType = "note";
  public label?: string | null = null;
  public selected: boolean = false;
  public expanded: boolean = false;
  public imploded: boolean = false;

  public paras: Record<string, SectionData> = {};

  constructor(
    name: string,
    path: string,
    inlinkCount: number,
    outlinkCount: number,
    imagePath?: string,
    image?: ImageBitmap,
    val = 10,
    neighbors: Node[] = [],
    links: Link[] = []
    // parents: Node[] = []
  ) {
    this.id = path;
    this.name = name;
    this.path = path;
    this.inlinkCount = inlinkCount;
    this.outlinkCount = outlinkCount;
    this.val = val;
    this.neighbors = neighbors;
    // this.parents = parents;
    this.links = links;
    this.unresolved = val == 0;
    this.idx = -1;
    this.imagePath = imagePath;
    this.image = image;
    this.expanded = outlinkCount == 0;
  }

  // Creates an array of nodes from an array of files (from the Obsidian API)
  static createFromFiles(files: TAbstractFile[]): Node[] {
    return files.map((file) => {
      return new Node(file.name, file.path, 0, 0);
    });
  }

  toggle(currMin: number, currMax: number) {
    this.zIndex = currMax + 1;
  }

  /**
   * given a node, check if it is a neighbour of current node. If yes,
   * Links together two nodes as neighbors (node -> neighbor).
   *
   */
  addNeighbor(neighbor: Node) {
    if (!this.isNeighborOf(neighbor)) {
      if (!this.neighbors.includes(neighbor)) this.neighbors.push(neighbor);
      if (!neighbor.neighbors.includes(this)) neighbor.neighbors.push(this);
    }
  }

  // addParent(parent: Node) {
  //   if (!this.parents.includes(parent)) this.parents.push(parent);
  // }

  // Pushes a link to the node's links array if it doesn't already exist
  addLink(link: Link, isGlobal: boolean = false) {
    if (!this.links.some((l) => l.source === link.source && l.target === link.target)) {
      this.links.push(link);

      if (isGlobal) {
        if (link.source.path === this.path) {
          ++this.outlinkCount;
        } else {
          ++this.inlinkCount;
        }
      }
    }
  }

  // Whether the node is a neighbor of another node
  public isNeighborOf(node: Node | string) {
    if (node instanceof Node) return this.neighbors.includes(node);
    else return this.neighbors.some((neighbor) => neighbor.id === node);
  }

  /**
   * Child links has target pointing to the child.
   * @param nodePath
   */
  public isParentOf(nodePath: string) {
    // return this.parents.some((parent) => parent.path === nodePath);
    return this.path !== nodePath && this.links.some((link) => link.target.path === nodePath);
  }

  public isChildOf(nodePath: string) {
    return this.path !== nodePath && this.links.some((link) => link.source.path === nodePath);
  }

  public static compare = (a: Node, b: Node) => {
    return a.path === b.path;
  };

  public static createNodeIndex(nodes: Node[]) {
    const nodeIndex = new Map<string, number>();
    nodes.forEach((node, index) => {
      nodeIndex.set(node.id, index);
    });
    return nodeIndex;
  }
}
