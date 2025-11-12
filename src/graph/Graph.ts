import type { LinkCache } from "@/graph/Link";
import type { App } from "obsidian";

import { Link } from "@/graph/Link";
import { Node } from "@/graph/Node";

export class Graph {
  public rootPath: string | undefined;
  public readonly nodes: Node[];
  public readonly links: Link[];

  // Indexes to quickly retrieve nodes and links by id
  private readonly nodeIndex: Map<string, number>;
  private readonly linkIndex: Map<string, Map<string, number>>;

  constructor(
    rootPath: string | undefined,
    nodes: Node[],
    links: Link[],
    nodeIndex: Map<string, number>,
    linkIndex: Map<string, Map<string, number>>
  ) {
    this.rootPath = rootPath;
    this.nodes = nodes;
    this.links = links;
    this.nodeIndex = nodeIndex || new Map<string, number>();
    this.linkIndex = linkIndex || new Map<string, Map<string, number>>();
  }

  public resort() {
    this.nodes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  public getNodeById(id: string): Node | null {
    const index = this.nodeIndex.get(id);
    if (typeof index === "number") {
      return this.nodes[index] ?? null;
    }
    return null;
  }

  public getLinksFromNode(sourceNodeId: string): Link[] {
    const linkIndexes = this.linkIndex.get(sourceNodeId);
    if (linkIndexes) {
      return Array.from(linkIndexes.values())
        .map((index) => this.links[index])
        .filter(Boolean);
    }
    return [];
  }

  public static createEmpty = (): Graph => {
    return new Graph(undefined, [], [], new Map(), new Map());
  };

  // Creates a graph using the Obsidian API
  public static createFromApp = (app: App, baseFolder: string): Graph => {
    console.debug(`Create mind map from path ${baseFolder}`);
    const map = getMapFromMetaCache(
      baseFolder,
      app.metadataCache.resolvedLinks,
      app.metadataCache.unresolvedLinks
    );
    const config = app.vault.config;
    const userExcludedFolders = config.userIgnoreFilters;
    const allFiles = userExcludedFolders
      ? app.vault
          .getFiles()
          .filter((file) => !userExcludedFolders.some((folder) => file.path.startsWith(folder)))
      : app.vault.getFiles();

    const nodes = Node.createFromFiles(allFiles);
    return Graph.createFromLinkMap(app, map, nodes, true);
  };

  public static createFromLinkMap(
    app: App,
    map: {
      [x: string]: string[];
    },
    nodes: Node[],
    isGlobal: boolean = false
  ) {
    // Create new instances of nodes
    const newNodes = nodes.map(
      (node) =>
        new Node(
          node.name,
          node.path,
          node.inlinkCount,
          node.outlinkCount,
          node.imagePath,
          node.image,
          node.val
        )
    );
    const nodeMap = new Map<string, Node>();
    newNodes.forEach((node) => nodeMap.set(node.id, node));

    const links: Link[] = [];

    Object.entries(map).forEach(([sourceId, targetIds]) => {
      const sourceNode = nodeMap.get(sourceId);
      if (!sourceNode) return;

      targetIds.forEach((targetId) => {
        if (isAvatarImg(targetId)) {
          sourceNode.imagePath = targetId;
        } else {
          let targetNode = nodeMap.get(targetId);
          if (!targetNode) {
            targetNode = new Node(targetId, targetId, 0, 0);
            newNodes.push(targetNode);
          }

          // Create new instances of links
          const link = new Link(sourceNode, targetNode);
          links.push(link);

          // As we are creating new nodes, we need to make sure they are properly linked
          sourceNode.addNeighbor(targetNode);
          sourceNode.addLink(link, isGlobal);
          targetNode.addLink(link, isGlobal);
        }
      });
    });

    return new Graph(
      undefined,
      newNodes,
      links,
      Node.createNodeIndex(newNodes),
      Link.createLinkIndex(links)
    );
  }

  /**
   * filter the nodes of the graph, the links will be filtered automatically.
   * @param predicate what nodes to keep
   * @param graph the graph to filter
   * @returns a new graph
   */
  public filter = (
    app: App,
    predicate: (node: Node) => boolean,
    linksPredicate?: (link: Link) => boolean
  ) => {
    // Filter nodes based on the predicate
    const filteredNodes = this.nodes.filter(predicate);

    // Create a quick lookup set for filtered node IDs
    const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));

    // Filter links
    const filteredLinks = this.links.filter((link) => {
      // Check if both source and target nodes are in the filtered node set
      const linkIsValid =
        filteredNodeIds.has(link.source.id) && filteredNodeIds.has(link.target.id);

      // Apply the linksPredicate if provided
      return linkIsValid && (!linksPredicate || linksPredicate(link));
    });

    // transform the link to linkmap
    const linkMap = Link.createLinkMap(filteredLinks);

    return Graph.createFromLinkMap(app, linkMap, filteredNodes);
  };

  public filterNodes(pred: (node: Node) => boolean): Node[] {
    return this.nodes.filter(pred);
  }

  public applyNodes = (fun: (node: Node) => void): void => {
    this.nodes.forEach(fun);
  };

  private isCyclicUtil = (nodeId: string, visited: Set<string>, recStack: Set<string>): boolean => {
    if (!visited.has(nodeId)) {
      // Add to visited and recursion stack
      visited.add(nodeId);
      recStack.add(nodeId);

      // Get all adjacent nodes (i.e., following the direction of links)
      const adjNodes = this.getLinksFromNode(nodeId).map((link) =>
        link.source.id === nodeId ? link.target.id : link.source.id
      );

      for (const neighborId of adjNodes) {
        if (!visited.has(neighborId) && this.isCyclicUtil(neighborId, visited, recStack)) {
          return true;
        } else if (recStack.has(neighborId)) {
          // If the node is in the recursion stack, it means we've found a cycle
          return true;
        }
      }
    }

    // Remove from recursion stack
    recStack.delete(nodeId);
    return false;
  };
}

function isAvatarImg(nodePath: string) {
  return nodePath.startsWith("avatars/");
}

const getMapFromMetaCache = (
  baseFolder: string,
  resolvedLinks: LinkCache,
  unresolvedLinks: LinkCache
) => {
  const result: Record<string, string[]> = {};
  Object.keys(resolvedLinks)
    .filter((nodeId) => nodeId.startsWith(baseFolder))
    .map((nodeId) => {
      result[nodeId] = (
        Object.keys(resolvedLinks[nodeId]!).map((nodePath) => {
          return nodePath;
        }) ?? []
      )
        .concat(
          Object.keys(unresolvedLinks[nodeId]!).map((nodePath) => {
            return nodePath;
          }) ?? []
        )
        .filter(
          (nodePath) =>
            nodePath.startsWith(baseFolder) && (nodePath.endsWith(".md") || isAvatarImg(nodePath))
        );
    });

  // remove self links
  Object.keys(result).forEach((nodeId) => {
    result[nodeId] = result[nodeId]?.filter((nodePath) => nodePath !== nodeId) ?? [];
  });
  return result;
};
