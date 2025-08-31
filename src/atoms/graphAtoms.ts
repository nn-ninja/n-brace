import { atom } from "jotai/vanilla";
import type { Link } from "@/graph/Link";
import type { Node } from "@/graph/Node";
import { atomWithReset } from "jotai/utils";
import type { Graph } from "@/graph/Graph";
import { DEFAULT_SETTING } from "@/SettingManager";

export const dimensionsAtom = atom({ width: 0, height: 0 });

interface GraphNavState {
  selectedPath?: string;
  selectedIndex?: number;
}

export type GraphSettings = {
  graphSpan: number;
  linkColorIn: string;
  linkColorOut: string;
  linkColorOther: string;
};

export type NavHistory = {
  backward: Record<string, string>;
  forward: Record<string, string>;
};

export type NavIndexHistory = {
  backward: Record<number, number>;
  forward: Record<number, number>;
};

export const graphNavAtom = atomWithReset<GraphNavState>({
  selectedPath: undefined,
  selectedIndex: undefined,
});

export const nodeIdxMaxAtom = atom(0);

export const graphSettingsAtom = atom<GraphSettings>({
  graphSpan: DEFAULT_SETTING.pluginSetting.defaultGraphSpan,
  linkColorIn: DEFAULT_SETTING.pluginSetting.linkColorIn,
  linkColorOut: DEFAULT_SETTING.pluginSetting.linkColorOut,
  linkColorOther: DEFAULT_SETTING.pluginSetting.linkColorOther,
});

export const navHistoryAtom = atom<NavHistory>({ backward: {}, forward: {} });

export const navIndexHistoryAtom = atomWithReset<NavIndexHistory>({ backward: {}, forward: {} });

/** Temporal state turning into selected node. */
export const expandNodePathAtom = atom<string | undefined>(undefined);

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
