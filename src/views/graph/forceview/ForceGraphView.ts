import type {
  GraphSetting,
  GraphType,
  LocalGraphSettings,
} from "@/SettingsSchemas";
import { Graph } from "@/graph/Graph";
import type ForceGraphPlugin from "@/main";
import { AsyncEventBus } from "@/util/EventBus";
import { LifeCycle } from "@/util/LifeCycle";
import { ObsidianTheme } from "@/util/ObsidianTheme";
import { createNotice } from "@/util/createNotice";
import { MyForceGraph, getTooManyNodeMessage } from "@/views/graph/ForceGraph";
import type {
  BaseGraphSettingManager,
  GraphSettingManager,
} from "@/views/settings/graphSettingManagers/GraphSettingsManager";
import type { Component, HoverParent, HoverPopover, ItemView } from "obsidian";
import { classes } from "polytype";
import type { Node } from "@/graph/Node";

export type BaseForceGraphView = ForceGraphView<BaseGraphSettingManager, ItemView>;

export abstract class ForceGraphView<
    M extends GraphSettingManager<GraphSetting, ForceGraphView<M, V>>,
    V extends ItemView
  >
  extends classes(LifeCycle)
  implements HoverParent
{
  readonly plugin: ForceGraphPlugin;
  readonly graphType: GraphType;
  protected forceGraph: MyForceGraph<ForceGraphView<M, ItemView>>;
  public theme: ObsidianTheme;
  eventBus: AsyncEventBus = new AsyncEventBus();

  public abstract readonly settingManager: M;
  public readonly contentEl: HTMLDivElement;
  /**
   * this view can be either Graph Item view or markdown view if it is a post processor view
   *
   * @remark this is the parent view
   */
  itemView: V;
  hoverPopover: HoverPopover | null = null;

  protected constructor(
    contentEl: HTMLDivElement,
    plugin: ForceGraphPlugin,
    graphType: GraphType,
    itemView: V
  ) {
    super();
    this.contentEl = contentEl;
    this.contentEl.classList.add("force-graph-view");
    this.plugin = plugin;
    this.itemView = itemView;
    this.graphType = graphType;
    this.theme = new ObsidianTheme(this.plugin.app.workspace.containerEl);
    // since setting manager need to be initialized first before the force graph
    // in the graph view constructor, we need to initialize it in the in the onReady function
    this.forceGraph = undefined as unknown as MyForceGraph<ForceGraphView<M, ItemView>>;
  }

  /**
   * 1. need to initialize force graph here but this class doesn't know how to initialize it
   * 2. graph setting manager need to init a view here
   */
  protected onReady(): void {
    // register event on event bus
    const parent = this.getParent();
    parent.registerEvent(
      this.eventBus.on("open-node-preview", (node: Node) => {
        const event = new MouseEvent("mouseenter", {
          clientX: this.plugin.mousePosition.x,
          clientY: this.plugin.mousePosition.y,
          ctrlKey: true,
          metaKey: true,
        });
        this.forceGraph.view.plugin.app.workspace.trigger("hover-link", {
          event: event,
          source: "force-graph",
          hoverParent: this.forceGraph.view,
          targetEl: this.forceGraph.view.contentEl,
          linktext: node.path,
        });
      })
    );
  }

  /**
   * get the current force graph object
   */
  public getForceGraph() {
    return this.forceGraph;
  }

  abstract getParent(): Component;

  /**
   * destroy the old graph, remove the old graph completely from the DOM.
   * reassign a new graph base on setting like the constructor,
   * then render it.
   */
  public refreshGraph() {
    const graph = this.forceGraph?.instance.graphData();

    // get the first child of the content element
    const forceGraphEl = this.contentEl.firstChild;
    forceGraphEl?.remove();

    // destroy the old graph, remove the old graph completely from the DOM
    this.forceGraph.instance._destructor();

    // @ts-ignore
    this.forceGraph = null;

    this.theme = new ObsidianTheme(this.plugin.app.workspace.containerEl);

    this.updateGraphData(graph);
  }

  /**
   * given some files, update the graph data.
   */
  protected updateGraphData(graph: Graph) {
    const tooLarge =
      graph.nodes.length > this.plugin.settingManager.getSettings().pluginSetting.maxNodeNumber;
    if (tooLarge) {
      createNotice(getTooManyNodeMessage(graph.nodes.length));
    }

    // seem like typescript cannot handle the type of this correctly when circular dependency generics
    type ForceGraphView = typeof this.forceGraph.view;

    if (!this.forceGraph)
      this.forceGraph = new MyForceGraph(this as ForceGraphView, tooLarge ? Graph.createEmpty() : graph);
    else this.forceGraph.updateGraph(tooLarge ? Graph.createEmpty() : graph);
    // get current focus element
    const focusEl = document.activeElement as HTMLElement | null;
    // move the setting to the front of the graph
    this.contentEl.appendChild(this.settingManager.containerEl);

    // focus on the focus element
    try {
      focusEl?.focus();
    } catch (e) {
      console.error((e as Error).message);
    }

    // make sure the render is at the right place if it is an item view
    if (this.itemView) this.itemView.onResize();
  }

  /**
   * when the search result is change, the graph view need to know how to response to this.
   */
  public abstract handleSearchResultChange(): void;

  /**
   * when the group color is change, the graph view need to know how to response to this.
   */
  public abstract handleGroupColorSearchResultChange(): void;

  /**
   * when the metadata cache is change, the graph is updated. The graph view need to know how to response to this.
   */
  public abstract handleMetadataCacheChange(): void;

  protected abstract getNewGraphData(): Graph;

  /**
   * when the setting is updated, the graph view need to know how to response to this.
   */
  public handleSettingUpdate(
    newSetting: GraphSetting,
    ...path: (NestedKeyOf<LocalGraphSettings>)[]
  ): void {
    if (path.includes("")) {
      this.forceGraph?.interactionManager.updateNodeLabelDiv();
    }
    if (path.some((p) => p === "filter.showAttachments" || p === "filter.showOrphans")) {
      // we need to update force graph data
      this.updateGraphData(this.getNewGraphData());
    }
    if (path.some((p) => p.startsWith("groups"))) {
      this.forceGraph?.interactionManager.updateColor();
    }
    if (path.includes("display.nodeSize")) {
      this.forceGraph?.updateConfig({
        display: {
          nodeSize: newSetting.display.nodeSize,
        },
      });
    }
    if (path.includes("display.linkDistance")) {
      this.forceGraph?.updateConfig({
        display: {
          linkDistance: newSetting.display.linkDistance,
        },
      });
    }
    if (path.includes("display.linkThickness")) {
      this.forceGraph?.updateConfig({
        display: {
          linkThickness: newSetting.display.linkThickness,
        },
      });
    }
    if (path.includes("display.nodeRepulsion")) {
      this.forceGraph?.updateConfig({
        display: {
          nodeRepulsion: newSetting.display.nodeRepulsion,
        },
      });
    }
    if (path.includes("display.showExtension") || path.includes("display.showFullPath")) {
      this.forceGraph?.interactionManager.updateNodeLabelDiv();
    }
    if (path.includes("display.dagOrientation")) {
      this.forceGraph?.updateConfig({
        display: {
          dagOrientation: newSetting.display.dagOrientation,
        },
      });
    }
  }
}
