import type { App, HoverParent, HoverPopover, PluginManifest } from "obsidian";
import { MarkdownView, Plugin } from "obsidian";
import { State } from "@/util/State";
import { Graph } from "@/graph/Graph";
import type { LinkCache } from "@/graph/Link";
import { deepCompare } from "@/util/deepCompare";
import "@total-typescript/ts-reset";
import "@total-typescript/ts-reset/dom";
import { eventBus } from "@/util/EventBus";
import { SettingTab } from "@/views/SettingTab";
import { config } from "@/config";
import { MyFileManager } from "@/FileManager";
import { PluginSettingManager } from "@/SettingManager";
import { GraphType } from "@/SettingsSchemas";
import { ReactForceGraphView, VIEW_TYPE_REACT_FORCE_GRAPH } from "@/views/ReactForceGraphView";
import { getDefaultStore } from "jotai/index";
import { graphDataAtom, graphNavAtom } from "@/atoms/graphAtoms";
import { RESET } from "jotai/utils";

export default class ForceGraphPlugin extends Plugin implements HoverParent {
  _resolvedCache: LinkCache;
  public readonly cacheIsReady: State<boolean> = new State(
    this.app.metadataCache.resolvedLinks !== undefined
  );
  readonly store = getDefaultStore();
  private isCacheReadyOnce = false;
  /**
   *  we keep a graph here because we dont want to create a new graph every time we open a graph view
   */
  public globalGraph: Graph;

  public fileManager: MyFileManager;
  public settingManager: PluginSettingManager;
  public baseFolder: string = "";

  public mousePosition = { x: 0, y: 0 };

  public hoverPopover: HoverPopover | null = null;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    // this will be initialized in the on cache changed function
    this._resolvedCache = undefined as unknown as LinkCache;
    // this will be initialized in the on cache changed function
    this.globalGraph = undefined as unknown as Graph;

    this.onGraphCacheChanged();

    this.settingManager = new PluginSettingManager(this);

    // this will be initialized in the onload function because we need to wait for the setting manager to initialize
    this.fileManager = undefined as unknown as MyFileManager;
  }

  /**
   * initialize all the things here
   */
  async onload() {
    // load the setting using setting manager
    await this.settingManager.loadSettings();

    // get the setting from setting manager
    // const setting = this.settingManager.getSetting("test");

    // initalise the file manager
    this.fileManager = new MyFileManager(this);

    // init the theme
    this.cacheIsReady.value =
      this.app.metadataCache.resolvedLinks !== undefined &&
      Object.keys(this.app.metadataCache.resolvedLinks).length > 0;
    this.onGraphCacheChanged();

    // init listeners
    this.initListeners();

    this.registerDomEvent(window, "mousemove", (event) => {
      // set the mouse position
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
    });

    this.addSettingTab(new SettingTab(this.app, this));

    this.registerView(config.viewType.local, (leaf) => {
      return new ReactForceGraphView(leaf, this);
    });

    // register hover link source TODO
    this.registerHoverLinkSource("force-graph", {
      defaultMod: true,
      display: "Brainavigator Graph",
    });
  }

  onunload(): void {
    super.unload();
    // unregister the resolved cache listener
    this.app.metadataCache.off("resolved", this.onGraphCacheReady);
    this.app.metadataCache.off("resolve", this.onGraphCacheChanged);
  }

  private initListeners() {
    // all files are resolved, so the cache is ready:
    this.app.metadataCache.on("resolved", this.onGraphCacheReady);
    // the cache changed:
    this.app.metadataCache.on("resolve", this.onGraphCacheChanged);

    // show open local graph button in file menu
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!file) return;
        menu.addItem((item) => {
          item
            .setTitle("Open in Brainavigator Graph")
            .setIcon(config.icon)
            .onClick(() => this.openGraph(GraphType.local));
        });
      })
    );
  }

  /**
   * this will be called the when the cache is ready.
   * And this will hit the else clause of the `onGraphCacheChanged` function
   */
  private onGraphCacheReady = () => {
    // console.log("Graph cache is ready");
    this.cacheIsReady.value = true;
    this.onGraphCacheChanged();
  };

  /**
   * check if the cache is ready and if it is, update the graph
   */
  public onGraphCacheChanged = () => {
    // check if the cache actually updated
    // Obsidian API sends a lot of (for this plugin) unnecessary stuff
    // with the resolve event
    if (!this.settingManager) {
      return;
    }
    if (
      this.cacheIsReady.value &&
      !deepCompare(this._resolvedCache, this.app.metadataCache.resolvedLinks)
    ) {
      this._resolvedCache = structuredClone(this.app.metadataCache.resolvedLinks);
      const pluginSetting = this.settingManager.getSettings().pluginSetting;
      this.baseFolder = pluginSetting.baseFolder;
      this.baseFolder = (this.baseFolder.endsWith("/") ? this.baseFolder : this.baseFolder + "/").substring(1);
      this.globalGraph = Graph.createFromApp(this.app, this.baseFolder);

    } else {
      this.isCacheReadyOnce = true;
    }
  };

  public resetGlobalGraph = async (baseFolder: string) => {
    this.baseFolder = (baseFolder.endsWith("/") ? baseFolder : baseFolder + "/").substring(1);
    console.info(`resetGlobalGraph ${this.baseFolder}`);
    // currentFile = this.app.workspace.getActiveFile();
    this.globalGraph = Graph.createFromApp(this.app, this.baseFolder);
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REACT_FORCE_GRAPH);
    if (!leaves || !leaves.length) {
      return;
    }
    const view: ReactForceGraphView = leaves[0].view;
    const graph = await view.getNewGraphData();
    this.store.set(graphDataAtom, graph);
    this.store.set(graphNavAtom, RESET);
  };

  /**
   * this function will open a graph view in the current leaf
   */
  private openGraph = async (graphType: GraphType) => {
    if (!this.app.workspace.lastActiveFile.path.startsWith(this.baseFolder)) {
      alert(`Your file isn't under mind map base path ${this.baseFolder}. You can set it up in settings.`);
      return;
    }

    eventBus.trigger("open-graph");

    const leaf = this.app.workspace.getLeaf("split");
    await leaf.setViewState({
      type: config.viewType.local,
      active: true,
    });
  };
}
