import { type Node } from "@/graph/Node";

export type LinkCache = Record<string, Record<string, number>>;

export class Link {
  public source: Node;
  public target: Node;
  public color: string = "green";
  public label?: string;
  public distance: number = 0;

  constructor(source: Node, target: Node) {
    this.source = source;
    this.target = target;
  }

  /**
   * Creates a link index for an array of links
   * @param links
   * @returns
   */
  static createLinkIndex(links: Link[]): Map<string, Map<string, number>> {
    const linkIndex = new Map<string, Map<string, number>>();
    links.forEach((link, index) => {
      if (!linkIndex.has(link.source.id)) {
        linkIndex.set(link.source.id, new Map<string, number>());
      }
      linkIndex.get(link.source.id)?.set(link.target.id, index);
    });

    return linkIndex;
  }

  static checkLinksValid(links: Link[]) {
    // if there are duplicate links, then throw an error
    links.forEach((link, index) => {
      links.forEach((link2, index2) => {
        if (index !== index2 && Link.compare(link, link2)) {
          throw new Error("graph duplicate links");
        }
      });
    });
  }

  public static compare = (a: Link, b: Link) => {
    return a.source.id === b.source.id && a.target.id === b.target.id;
  };

  public static createLinkMap(links: Link[]): { [x: string]: string[] } {
    const linkMap: { [x: string]: string[] } = {};
    links.forEach((link) => {
      if (!linkMap[link.source.id]) linkMap[link.source.id] = [];
      linkMap[link.source.id]?.push(link.target.id);
    });
    return linkMap;
  }
}
