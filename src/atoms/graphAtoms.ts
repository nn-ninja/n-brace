import { atom } from "jotai/vanilla";
import type { Link } from "@/graph/Link";
import type { Node } from "@/graph/Node";
import { atomWithReset } from "jotai/utils";
import type { Graph } from "@/graph/Graph";

export const dimensionsAtom = atom({ width: 0, height: 0 });

interface GraphNavState {
  selectedPath?: string;
}

export const graphNavAtom = atomWithReset<GraphNavState>({ selectedPath: undefined });

export const nodesAtom = atom<Node[]>([]);
export const linksAtom = atom<Link[]>([]);

export const graphDataAtom = atom(
  (get) => ({
    nodes: get(nodesAtom),
    links: get(linksAtom),
  }),
  (get, set, newGraph: Graph) => ({
    nodes: set(nodesAtom, newGraph.nodes),
    links: set(linksAtom, newGraph.links),
  })
);

// const graphData = atom(async (get) => {
//   const id = get(postId)
//   const response = await fetch(
//     `https://hacker-news.firebaseio.com/v0/item/${id}.json`
//   )
//   const data: PostData = await response.json()
//   return data
// })
