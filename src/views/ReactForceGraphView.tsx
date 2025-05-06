import { createContext } from "react";
import type { App, WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import ReactForceGraph from "@/views/graph/ReactForceGraph";
import { Graph } from "@/graph/Graph";
import type ForceGraphPlugin from "@/main";
import { dimensionsAtom } from "@/atoms/graphAtoms";
import { getDefaultStore } from "jotai";
import { getNewLocalGraph, loadImagesForGraph } from "@/views/graph/fileGraphMethods";
import { eventBus } from "@/util/EventBus";
import { PluginSettingManager } from "@/SettingManager";

export const VIEW_TYPE_REACT_FORCE_GRAPH = "react-force-graph-view";

export const AppContext = createContext<App | undefined>(undefined);
export const ViewContext = createContext<ReactForceGraphView | undefined>(undefined);

export class ReactForceGraphView extends ItemView {
  readonly plugin: ForceGraphPlugin;
  readonly store = getDefaultStore();
  root: Root | null = null;
  private width: number = this.contentEl.offsetWidth;
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
    return "N-brace your brain";
  }

  private handleSettingsUpdate() {
    this.renderComponent();
  }

  private renderComponent() {
    const initGraph = this.getNewGraphData.bind(this);
    const expandNodeFun = this.expandNode.bind(this);

    if (this.root) {
      this.root.render(
        <AppContext.Provider value={this.app}>
          <ViewContext.Provider value={this}>
            <ReactForceGraph
              getInitialGraph={initGraph}
              getExpandNode={expandNodeFun}
              titleFontSize={this.settingManager.getSettings().pluginSetting.titleFontSize}
            />
          </ViewContext.Provider>
        </AppContext.Provider>
      );
    }
  }

  async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
    this.renderComponent();
  }

  // TODO unmount ??

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
      return Promise.resolve(Graph.createEmpty());
    }
    const graph = getNewLocalGraph(this.plugin, {
      centerFilePath: nodePath,
      searchResults: [],
      filterSetting: {
        searchQuery: "",
        showOrphans: true,
        showAttachments: false,
        depth: 1,
        linkType: "both",
      },
    });
    await loadImagesForGraph(this.plugin, graph);
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
