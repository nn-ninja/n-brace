import { TFile } from "obsidian";


import type ForceGraphPlugin from "@/main";
import type { LocalGraphSettings } from "@/SettingsSchemas";
import type { App, Vault } from "obsidian";

import { Graph } from "@/graph/Graph";
import { Link } from "@/graph/Link";
import { Node } from "@/graph/Node";

/**
 *
 * @param graph
 * @param id the center node id
 * @param depth the max distance of the link away from the center node. If depth is 1,
 * then it mean the links directly connected to the center node. If depth is 2, then it means the links
 * directly connected to the center node and the links connected to the links connected to the center node
 * @param linkType
 * @returns nodes and link of a local graph. If link type is inlinks and outlinks, then it will be acyclic
 */
const traverseNode = (
  graph: Graph,
  id: string,
  depth: number,
  linkType: "both" | "outlinks" | "inlinks"
): { nodes: Node[]; links: Link[] } => {
  const visitedNodes = new Set<string>();
  const visitedLinks = new Set<Link>();
  const validLinks = new Set<Link>();
  const queue: { node: Node; depth: number }[] = [];

  const startNode = graph.getNodeById(id);
  if (startNode) {
    queue.push({ node: startNode, depth: 0 });
  }

  while (queue.length > 0) {
    const { node, depth: currentDepth } = queue.shift()!;
    if (!node) continue;
    visitedNodes.add(node.id);

    if (currentDepth < depth) {
      node.links.forEach((link) => {
        if (visitedLinks.has(link)) {
          return; // Skip already visited links
        }

        const neighbor = link.source === node ? link.target : link.source;
        const isOutlink = link.source === node;
        const isInlink = link.target === node;

        if (
          linkType === "both" ||
          (linkType === "outlinks" && isOutlink) ||
          (linkType === "inlinks" && isInlink)
        ) {
          let linkValid = false;
          visitedLinks.add(link);
          // if linktype is both, simply add to valid link
          // if link type is not both, then we need to check if the link is valid
          // a link is not valid when the neighbour node is already visited
          // because if the neighbour is already visit, there must be a link pointing to it
          if (linkType == "both") {
            linkValid = true;
          } else {
            // if link type is both, then we need to check if the link is valid
            // a link is not valid when the neighbour node is already visited
            // because if the neighbour is already visit, there must be a link pointing to it
            if (!visitedNodes.has(neighbor.id)) {
              linkValid = true;
            }
          }

          if (linkValid) validLinks.add(link);
          if (!visitedNodes.has(neighbor.id) && linkValid) {
            queue.push({ node: neighbor, depth: currentDepth + 1 });
          }
        }
      });
    }
  }

  return {
    nodes: [...visitedNodes].map((nodeId) => graph.getNodeById(nodeId)).filter(Boolean),
    links: [...validLinks],
  };
};

export const loadImagesForGraph = async (plugin: ForceGraphPlugin, graph: Graph) => {
  console.debug("Loading images...");
  const imageLoad = graph.nodes.map(async (node) => {
    // console.info(`try image ${node.path}... ${node.imagePath}`);
    if (node.imagePath && !node.image) {
      console.debug(`Loading ${node.imagePath} image for ${node.path}`);
      const file = plugin.app.vault.getAbstractFileByPath(node.imagePath);
      if (file instanceof TFile) {
        const arrayBuffer = await plugin.app.vault.readBinary(file);
        const blob = new Blob([arrayBuffer]);
        // Option for just rect image
        // node.image = await createImageBitmap(blob, { resizeWidth: 64, resizeHeight: 64 });

        const size = 192;
        const tempImage = await createImageBitmap(blob);
        const offscreenCanvas = new OffscreenCanvas(size, size);
        const ctx = offscreenCanvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get 2D context");

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();

        const lenRatio = tempImage.width / tempImage.height;
        // Option where you have clipped center of the image.
        const scaledW = lenRatio > 1.0 ? size * lenRatio : size;
        const scaledH = lenRatio > 1.0 ? size : size * lenRatio;
        // Option where you want to have shown full image fit in circle
        // const scaledW = lenRatio > 1.0 ? size : size / lenRatio;
        // const scaledH = lenRatio > 1.0 ? size / lenRatio : size;
        ctx.drawImage(tempImage, (size - scaledW) / 2, (size - scaledH) / 2, scaledW, scaledH);
        tempImage.close(); // Clean up temporary ImageBitmap

        const circularBlob = await offscreenCanvas.convertToBlob();
        node.image = await createImageBitmap(circularBlob);

        plugin.globalGraph.nodes.find((n) => n.path == node.path)!.image = node.image;
      }
    } else if (node.imagePath) {
      console.debug(`Image ${node.imagePath} for ${node.path} already loaded!`);
    }
    return node;
  });
  await Promise.all(imageLoad);
};

export const getNewLocalGraph = (
  plugin: ForceGraphPlugin,
  config?: {
    centerFilePath: string | null;
    filterSetting: LocalGraphSettings["filter"];
  }
) => {
  // get a new local graph (updated with cache) to make sure that the graph is updated with the latest cache

  // get the current search result

  // get the current show attachments and show orphans from graph setting

  // compose a new graph
  const centerFilePath = config?.centerFilePath ?? plugin.app.workspace.getActiveFile()?.path;

  if (!centerFilePath || !config) return Graph.createEmpty();

  const { nodes, links } = traverseNode(
    plugin.globalGraph,
    centerFilePath,
    config.filterSetting.depth,
    config.filterSetting.linkType
  );

  // active file must exist in local graph
  const graph = plugin.globalGraph
    // filter the nodes and links
    .filter(
      plugin.app,
      (node) => {
        // the center file, which must be shown
        if (node.path === centerFilePath) return true;
        return nodes.some((n) => n.path === node.path);
      },

      (link) => {
        return links.some(
          (l) => l.source.path === link.source.path && l.target.path === link.target.path
        );
      }
    )
    .filter(plugin.app, (node) => {
      // the center file, which must be shown
      if (node.path === centerFilePath) return true;
      //  if the search query is not empty and the search result is empty, then we don't need to filter the search result
      if (config.filterSetting.searchQuery === "") return true;
      // if the node is not in the files, then we will not show it, except
      return true;
    })
    .filter(plugin.app, (node) => {
      // the center file, which must be shown
      if (node.path === centerFilePath) return true;
      // if node is an orphan and show orphan is false, then we will not show it
      if (node.links.length === 0 && !config.filterSetting.showOrphans) return false;
      return true;
    });

  return graph;
};

export const implodeGraph = async (app: App, plugin: ForceGraphPlugin, nodePath: string): Promise<Graph> => {
  const node = plugin.globalGraph.nodes.find((n) => n.path == nodePath)
  if (node === undefined) {
    return Graph.createEmpty();
  }
  if (!node.imploded) {
    const file = app.vault.getAbstractFileByPath(nodePath);
    if (!file || !(file instanceof TFile)) {
      return Graph.createEmpty();
    }
    const sections = await parseNoteSections(file, app.vault);
    node.paras = sections.paras;
  }

  const paraLinks: Link[] = [];
  const paraNodes = Object.entries(node.paras).filter(([key]) => { return key !== ''})
    .map(([paraTitle, sections]) => {
      const paraName = paraTitle.contains("#") ? paraTitle.substring(0, paraTitle.indexOf('#')) : paraTitle;
      const paraPath = paraTitle.contains("#") ? paraTitle : `${nodePath}#${paraTitle}`;
      // 3 stands for .md
      // const paraPath = `${node.path.substring(0, node.path.length - 3)}#${paraName}`;
      const paraNode = new Node(paraName, paraPath, 0, sections.links.length);
      paraNode.type = "para";
      paraNode.label = "para";
      paraNode.expanded = true;

      paraNode.links = [];
      for (const target of sections.links) {
        const targetNode = new Node(target, target, 0, 0);
        paraNode.links.push(new Link(paraNode, targetNode));
      }
      paraLinks.push(...paraNode.links);
      
      return paraNode;
    });

  return {
    nodes: paraNodes, links: paraLinks
  } as unknown as Graph;
}

export interface SectionData {
  links: string[]; // Resolved note names or paths
  level: number; // Heading level (1 for #, 2 for ##, etc.)
}

interface NoteGraphData {
  paras: Record<string, SectionData>; // e.g., {'#animal': {links: ['mustang', 'arab'], level: 1}}
  // Add other note metadata as needed
}

async function parseNoteSections(file: TFile, vault: Vault): Promise<NoteGraphData> {
  const content = await vault.read(file);
  const lines = content.split('\n');
  const sections: Record<string, SectionData> = {};
  let currentSection: string = '';
  let currentLevel = 0;
  sections[currentSection] = { links: [], level: 0 };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,1})\s*(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      currentSection = headingMatch[2].trim(); // e.g., 'animal' or 'wooden horse'
      currentLevel = level;
      if (!sections[currentSection]) {
        sections[currentSection] = { links: [], level };
      }
      continue; // Move to next line after setting section
    }

    // Extract wiki-style links [[Note|Alias]] or [[Note]], ignore embeds ![[ ]]
    const linkRegex = /\[\[([^!].+)]]/g; // Excludes embeds starting with !
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      const linkText = match[1].replace('|', '#').trim();
      sections[currentSection].links.push(linkText);
    }
  }

  return { paras: sections };
}
