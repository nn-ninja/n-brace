import { getDefaultStore } from "jotai";
import { RESET } from "jotai/utils";
import { ItemView } from "obsidian";
import { StrictMode, createContext } from "react";
import { createRoot } from "react-dom/client";

import type ForceGraphPlugin from "@/main";
import type { PluginSettingManager } from "@/SettingManager";
import type { IconName, WorkspaceLeaf } from "obsidian";
import type { Root } from "react-dom/client";


import { dimensionsAtom, expandNodePathAtom, graphDataAtom, graphNavAtom, navIndexHistoryAtom, nodeIdxMaxAtom } from "@/atoms/graphAtoms";
import { config } from "@/config";
import { AppContext } from "@/context";
import { Graph } from "@/graph/Graph";
import { tagIndex } from "@/graph/TagIndex";
import { eventBus } from "@/util/EventBus";
import { getNewLocalGraph, loadImagesForGraph, loadTagsForGraph } from "@/views/graph/fileGraphMethods";
import { ReactForceGraph } from "@/views/graph/ReactForceGraph";






export const VIEW_TYPE_REACT_FORCE_GRAPH = "react-force-graph-view";

export { AppContext };
export const ViewContext = createContext<ReactForceGraphView | undefined>(undefined);

export class ReactForceGraphView extends ItemView {
  readonly plugin: ForceGraphPlugin;
  readonly store = getDefaultStore();
  root: Root | null = null;
  private settingManager: PluginSettingManager;

  constructor(leaf: WorkspaceLeaf, plugin: ForceGraphPlugin) {
    super(leaf);
    this.plugin = plugin;

    this.settingManager = this.plugin.settingManager;
    eventBus.on("settings-updated", this.handleSettingsUpdate.bind(this));
  }

  getViewType() {
    return VIEW_TYPE_REACT_FORCE_GRAPH;
  }

  getDisplayText() {
    return config.displayText.local;
  }

  getIcon(): IconName {
    return config.icon;
  }

  private handleSettingsUpdate() {
    this.renderComponent();
  }

  private renderComponent() {
    const expandNodeFun = this.expandNode.bind(this);

    if (this.root) {
      this.root.render(
        <StrictMode>
          <AppContext.Provider value={this.app}>
            <ViewContext.Provider value={this}>
              <ReactForceGraph
                getExpandNode={expandNodeFun}
                titleFontSize={this.settingManager.getSettings().pluginSetting.titleFontSize}
              />
            </ViewContext.Provider>
          </AppContext.Provider>
        </StrictMode>
      );
    }
  }

  async onOpen() {
    // Reset all graph state so reopening always shows a fresh graph
    this.store.set(graphDataAtom, Graph.createEmpty());
    this.store.set(graphNavAtom, RESET);
    this.store.set(navIndexHistoryAtom, RESET);
    this.store.set(nodeIdxMaxAtom, 0);

    this.root = createRoot(this.containerEl.children[1]!);
    this.renderComponent();

    const path = (this.plugin.app.workspace.getActiveFile()
      ?? this.plugin.app.workspace.lastActiveFile)?.path;
    if (path) {
      this.store.set(expandNodePathAtom, path);
    }
  }

  onResize() {
    super.onResize();
    this.store.set(dimensionsAtom, {
      width: this.contentEl.offsetWidth,
      height: this.contentEl.offsetHeight,
    });
  }

  protected async expandNode(nodePath: string | undefined): Promise<Graph> {
    console.debug("node to expand ", nodePath);
    if (!nodePath || !this.plugin.globalGraph) {
      console.debug("Returning empty graph.");
      return Graph.createEmpty();
    }
    const graph = getNewLocalGraph(this.plugin, {
      centerFilePath: nodePath,
      filterSetting: {
        searchQuery: "",
        showOrphans: true,
        showAttachments: false,
        depth: 1,
        linkType: "both",
      },
    });
    await loadImagesForGraph(this.plugin, graph);
    loadTagsForGraph(this.app, graph, tagIndex);
    graph.rootPath = nodePath;
    graph.nodes.forEach((n) => {
      if (n.path === nodePath) {
        n.expanded = true;
      }
    });
    console.debug(`Graph loaded ${nodePath}`);
    return graph;
  }

  public async getNewGraphData(): Promise<Graph> {
    return this.expandNode(this.plugin.app.workspace.getActiveFile()?.path ?? undefined);
  }

  async onClose() {
    this.root?.unmount();
  }
}
