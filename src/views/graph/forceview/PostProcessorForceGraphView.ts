import { GraphType } from "@/SettingsSchemas";
import type { Graph } from "@/graph/Graph";
import { ForceGraphView } from "@/views/graph/forceview/ForceGraphView";
import { getNewLocalGraph } from "@/views/graph/forceview/LocalForceGraphView";
import { PostProcessorGraphSettingManager } from "@/views/settings/graphSettingManagers/PostProcessorGraphSettingManager";
import type { Component, MarkdownView, TFile } from "obsidian";
import type { ForceGraphViewMarkdownRenderChild } from "@/views/graph/ForceGraphViewMarkdownRenderChild";
import { MyForceGraph } from "@/views/graph/ForceGraph";
import type ForceGraphPlugin from "@/main";

export class PostProcessorForceGraphView extends ForceGraphView<
  PostProcessorGraphSettingManager,
  MarkdownView
> {
  itemView: MarkdownView;
  parent: ForceGraphViewMarkdownRenderChild;
  settingManager: PostProcessorGraphSettingManager;

  public handleSearchResultChange(): void {
    this.updateGraphData();
  }
  public handleGroupColorSearchResultChange(): void {
    this.forceGraph.interactionManager.updateColor();
  }
  public handleMetadataCacheChange(): void {
    this.updateGraphData();
  }

  protected updateGraphData() {
    super.updateGraphData(this.getNewGraphData());
  }

  protected getNewGraphData(): Graph {
    const graph = getNewLocalGraph(this.plugin, {
      centerFile: this.parent.markdownView.file,
      searchResults: this.settingManager.searchResult.value.filter.files,
      filterSetting: {
        // TODO: since this `getNewLocalGraph` function is originally for local graph, the setting is a bit different, we have to manually set it for now
        ...this.settingManager.getCurrentSetting().filter,
        depth: 1,
        linkType: "both",
      },
    });
    return graph;
  }
  private constructor(
    plugin: ForceGraphPlugin,
    contentEl: HTMLElement,
    markdownView: MarkdownView,
    parent: ForceGraphViewMarkdownRenderChild
  ) {
    super(contentEl as HTMLDivElement, plugin, GraphType.postProcessor, markdownView);
    this.parent = parent;
    this.itemView = markdownView as MarkdownView & {
      file: TFile;
    };
    this.settingManager = PostProcessorGraphSettingManager.new(this);
  }

  static new(
    plugin: ForceGraphPlugin,
    contentEl: HTMLElement,
    markdownView: MarkdownView,
    parent: ForceGraphViewMarkdownRenderChild
  ) {
    const view = new PostProcessorForceGraphView(plugin, contentEl, markdownView, parent);
    view.onReady();
    // put the setting view in the content el
    return view;
  }

  getParent(): Component {
    return this.parent;
  }

  onReady(): void {
    super.onReady();
    // first we need to create the force graph
    this.forceGraph = new MyForceGraph(
      this as typeof this.forceGraph.view,
      getNewLocalGraph(this.plugin)
    );
    // post process graph will not have graph
    //  setting manager init view
    // this.settingManager.initNewView(true);
  }
}
