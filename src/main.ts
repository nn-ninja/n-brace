import { Plugin, TFile } from "obsidian";

import type { LinkCache } from "@/graph/Link";
import type { App, HoverParent, HoverPopover, PluginManifest, WorkspaceLeaf } from "obsidian";

import {
  expandNodePathAtom,
  graphDataAtom,
  graphNavAtom,
  graphSettingsAtom,
  navIndexHistoryAtom,
  nodeIdxMaxAtom,
} from "@/atoms/graphAtoms";
import { config } from "@/config";
import { Graph } from "@/graph/Graph";
import { PluginSettingManager } from "@/SettingManager";
import { deepCompare } from "@/util/deepCompare";
import { eventBus } from "@/util/EventBus";
import { State } from "@/util/State";


import "@total-typescript/ts-reset";
import "@total-typescript/ts-reset/dom";
import { ReactForceGraphView, VIEW_TYPE_REACT_FORCE_GRAPH } from "@/views/ReactForceGraphView";
import { SettingTab } from "@/views/SettingTab";

import { getDefaultStore } from "jotai/index";

import type { GraphSettings } from "@/atoms/graphAtoms";


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

  public settingManager: PluginSettingManager;
  public baseFolder: string = "";
  public mousePosition = { x: 0, y: 0 };

  public hoverPopover: HoverPopover | null = null;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    console.debug('Main construct start.');

    // this will be initialized in the on cache changed function
    this._resolvedCache = undefined as unknown as LinkCache;
    // this will be initialized in the on cache changed function
    this.globalGraph = undefined as unknown as Graph;

    this.onGraphCacheChanged();

    this.settingManager = new PluginSettingManager(this);
  }

  /**
   * initialize all the things here
   */
  async onload() {

    console.debug('Main onload start.');
    await this.settingManager.loadSettings();

    // get the setting from setting manager
    // const setting = this.settingManager.getSetting("test");

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

    this.registerView(VIEW_TYPE_REACT_FORCE_GRAPH, (leaf) => {
      return new ReactForceGraphView(leaf, this);
    });

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf && leaf.view.getViewType() === "markdown") {
          const file = leaf.view.file;
          if (file) {
            console.debug(`File navigated to: ${file.path}`);
            eventBus.trigger("focus-node", file.path);
            this.store.set(expandNodePathAtom, file.path);
          }
        }
      })
    );

    this.registerHoverLinkSource("force-graph", {
      defaultMod: true,
      display: "N-brace",
    });

    eventBus.on("open-file", (filePath: string) => {
      if (filePath.contains("#")) {
        this.openParaInFirstTab(filePath);
      } else {
        this.openFileInFirstTab(filePath);
      }
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
            .setTitle("use N-brace")
            .setIcon(config.icon)
            .onClick(() => this.openGraph());
        });
      })
    );
  }

  async openFileInFirstTab(filePath: string) {
    const { workspace } = this.app;

    // Find the first Markdown leaf (Tab 1)
    // const markdownLeaves = workspace.getLeavesOfType("markdown");
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
      return;
    }

    const graphLeaf = workspace.getLeavesOfType(VIEW_TYPE_REACT_FORCE_GRAPH)[0];
    if (!graphLeaf) {
      console.error("Graph view not found");
      return;
    }

    // Get Markdown leaves in the left split relative to the graph view
    const leftMarkdownLeaves = this.getLeftMarkdownLeaves(graphLeaf);

    const targetLeaf = this.getRightmostLeaf(leftMarkdownLeaves);
    if (targetLeaf !== undefined) {
      if (filePath !== targetLeaf.view.file?.path) {
        await targetLeaf.openFile(file);
        workspace.revealLeaf(targetLeaf);
      }
    } else {
      // No Markdown leaves in left split, create a new left tab
      const newLeaf = workspace.createLeafBySplit(graphLeaf, "vertical", true); // Split left
      await newLeaf.openFile(file);
      workspace.revealLeaf(newLeaf);
    }
  }

  async openParaInFirstTab(rawPath: string) {
    const { workspace, vault } = this.app;

    const [rawFilePath, paragraph] = rawPath.split("#");
    if (!rawFilePath) return;

    // --- 2) Ensure .md extension ---
    const filePath = rawFilePath.endsWith(".md")
      ? rawFilePath
      : rawFilePath + ".md";
    const file = vault.getAbstractFileByPath(filePath);

    if (!file || !(file instanceof TFile)) {
      console.error("File not found:", filePath);
      return;
    }

    const graphLeaf = workspace.getLeavesOfType(VIEW_TYPE_REACT_FORCE_GRAPH)[0];
    if (!graphLeaf) {
      console.error("Graph view not found");
      return;
    }

    // 3. Wybierz właściwy leaf (tak jak u Ciebie)
    const leftMarkdownLeaves = this.getLeftMarkdownLeaves(graphLeaf);
    const targetLeaf = this.getRightmostLeaf(leftMarkdownLeaves);

    let leafToUse: WorkspaceLeaf;

    if (targetLeaf !== undefined) {
      leafToUse = targetLeaf;

      if (filePath !== targetLeaf.view.file?.path) {
        await targetLeaf.openFile(file);
      }
    } else {
      leafToUse = workspace.createLeafBySplit(graphLeaf, "vertical", true);
      await leafToUse.openFile(file);
    }

    if (paragraph) {
      await workspace.openLinkText(`${filePath}#${paragraph}`, filePath, false);
    }

    workspace.setActiveLeaf(graphLeaf, { focus: true });
  }

  private getLeftMarkdownLeaves(graphLeaf: WorkspaceLeaf): WorkspaceLeaf[] {
    const { workspace } = this.app;
    const markdownLeaves = workspace.getLeavesOfType("markdown");
    const leftLeaves: WorkspaceLeaf[] = [];

    // Get bounding rect of the graph leaf
    const graphRect = graphLeaf.view.containerEl.getBoundingClientRect();

    // Filter Markdown leaves that are to the left of the graph leaf
    markdownLeaves.forEach((leaf) => {
      const leafRect = leaf.view.containerEl.getBoundingClientRect();
      if (leafRect.width > 0 && leafRect.right <= graphRect.left) {
        leftLeaves.push(leaf);
      }
    });

    return leftLeaves;
  }

  private getRightmostLeaf(leaves: WorkspaceLeaf[]): WorkspaceLeaf | undefined {
    if (leaves.length === 0) {
      return undefined;
    }
    if (leaves.length === 1) {
      return leaves[0];
    }

    let rightmostLeaf = leaves[0];
    let maxRight = -Infinity;

    leaves.forEach((leaf) => {
      const rect = leaf.view.containerEl.getBoundingClientRect();
      if (rect.right > maxRight) {
        maxRight = rect.right;
        rightmostLeaf = leaf;
      }
    });

    return rightmostLeaf;
  }

  /**
   * this will be called the when the cache is ready.
   * And this will hit the else clause of the `onGraphCacheChanged` function
   */
  private onGraphCacheReady = () => {
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
      this.resetGlobalGraph(pluginSetting.baseFolder);
    } else {
      this.isCacheReadyOnce = true;
    }
  };

  public resetGlobalGraph = async (baseFolder: string) => {
    this.baseFolder = (baseFolder.endsWith("/") ? baseFolder : baseFolder + "/").substring(1);
    console.debug(`resetGlobalGraph ${this.baseFolder}`);

    const loadingOverlay: HTMLDivElement | undefined = this.prepLoadingOverlay();
    this.globalGraph = Graph.createFromApp(this.app, this.baseFolder);
    loadingOverlay?.remove();

    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REACT_FORCE_GRAPH);
    if (!leaves || !leaves.length) {
      return;
    }
    const view = leaves[0]!.view as ReactForceGraphView;
    const graph = await view.getNewGraphData();

    let maxIdx = 0;
    graph.nodes.forEach((n) => (n.idx = maxIdx++));
    this.store.set(nodeIdxMaxAtom, maxIdx);

    this.onGraphSettingAtomChanged({
      graphSpan: this.settingManager.getSettings().pluginSetting.defaultGraphSpan,
      linkColorIn: this.settingManager.getSettings().pluginSetting.linkColorIn,
      linkColorOut: this.settingManager.getSettings().pluginSetting.linkColorOut,
      linkColorOther: this.settingManager.getSettings().pluginSetting.linkColorOther,
    });

    console.debug(`Reset graph with max idx ${maxIdx - 1}`);
    this.store.set(graphDataAtom, graph);
    if (graph.rootPath) {
      this.store.set(graphNavAtom, { selectedPath: graph.rootPath });
    } else {
      this.store.set(graphNavAtom, RESET);
    }
    this.store.set(navIndexHistoryAtom, RESET);
  };

  /**r
   * this function will open a graph view in the current leaf
   */
  private openGraph = async () => {
    if (!this.app.workspace.lastActiveFile.path.startsWith(this.baseFolder)) {
      alert(
        `Your file isn't under mind map base path ${this.baseFolder}. You can set it up in settings.`
      );
      return;
    }

    const leaf = this.app.workspace.getLeaf("split");
    await leaf.setViewState({
      type: VIEW_TYPE_REACT_FORCE_GRAPH,
      active: true,
    });
  };

  onGraphSettingAtomChanged(settings: GraphSettings) {
    this.store.set(graphSettingsAtom, settings);
  }

  private prepLoadingOverlay() {
    const graphView = this.app.workspace.getLeavesOfType(VIEW_TYPE_REACT_FORCE_GRAPH);
    let loadingOverlay: HTMLDivElement | undefined = undefined;
    if (graphView.length > 0) {
      loadingOverlay = graphView[0]?.view.containerEl.createDiv({
        cls: "loading-overlay",
        attr: {
          style:
            "position: absolute; top: 0; left: 0; width: 100%; height: 100%; " +
            "background: rgba(0, 0, 0, 0.5); z-index: 9999; display: flex; align-items: center;",
        },
      });
      loadingOverlay?.createEl("h2", {
        text: "...loading...",
        attr: {
          style:
            "color: white; font-family: Arial, sans-serif; font-size: 24px; text-align: center;",
        },
      });
    }
    return loadingOverlay;
  }
}
