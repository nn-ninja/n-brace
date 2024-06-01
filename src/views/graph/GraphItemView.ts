import type { GraphType } from "@/SettingsSchemas";
import { config } from "@/config";
import type ForceGraphPlugin from "@/main";
import type { LocalForceGraphView } from "@/views/graph/forceview/LocalForceGraphView";
import type { WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";

export abstract class GraphItemView extends ItemView {
  readonly plugin: ForceGraphPlugin;
  /**
   * although we have a graph type in graph 3d view, we still need this graph type here in the item view
   * because the `getViewType` and `getDisplayText` method is called before the graph 3d view is created
   */
  abstract readonly graphType: GraphType.local;
  /**
   * in the graph item view, the graph view can only be local
   */
  abstract graphView: LocalForceGraphView;

  constructor(
    leaf: WorkspaceLeaf,
    plugin: ForceGraphPlugin
  ) {
    super(leaf);
    this.plugin = plugin;
  }

  onload(): void {
    super.onload();
    this.plugin.activeGraphViews.push(this.graphView);
  }

  onunload(): void {
    super.onunload();
    this.graphView.getForceGraph().instance._destructor();
    this.plugin.activeGraphViews = this.plugin.activeGraphViews.filter(
      (view) => view !== this.graphView
    );
  }

  getDisplayText(): string {
    return config.displayText[this.graphType];
  }

  getViewType(): string {
    return config.viewType[this.graphType];
  }

  getIcon(): string {
    return config.icon;
  }

  onResize() {
    super.onResize();
    if (this.graphView) this.graphView.getForceGraph().updateDimensions();
  }
}
