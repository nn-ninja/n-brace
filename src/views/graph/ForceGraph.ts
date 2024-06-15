import type { ForceGraphInstance as ForceGraphInstance, LinkObject } from "force-graph";
import ForceGraph from "force-graph";
import { Graph } from "@/graph/Graph";
import * as THREE from "three";
import * as d3 from "d3-force";
import { hexToRGBA } from "@/util/hexToRGBA";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { FOCAL_FROM_CAMERA, ForceGraphEngine } from "@/views/graph/ForceGraphEngine";
import type { DeepPartial } from "ts-essentials";
import type { Node } from "@/graph/Node";

import { rgba } from "polished";
import { createNotice } from "@/util/createNotice";
import type { GraphSetting, LocalGraphSettings } from "@/SettingsSchemas";
import { DagOrientation } from "@/SettingsSchemas";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { BaseForceGraphView, ForceGraphView } from "@/views/graph/forceview/ForceGraphView";
import type { ItemView, TFile } from "obsidian";
import type { GraphSettingManager } from "@/views/settings/graphSettingManagers/GraphSettingsManager";
import { syncOf } from "@/util/awaitof";
import { Link } from "@/graph/Link";

export const getTooManyNodeMessage = (nodeNumber: number) =>
  `Graph is too large to be rendered. Have ${nodeNumber} nodes.`;

type MyForceGraphInstance = Omit<ForceGraphInstance, "graphData"> & {
  graphData: {
    (): Graph; // When no argument is passed, it returns a Graph
    (graph: Graph): MyForceGraphInstance; // When a Graph is passed, it returns MyForceGraphInstance
  };
};

export type BaseForceGraph = MyForceGraph<BaseForceGraphView>;

/**
 * this class control the config and graph of the force graph. The interaction is not control here.
 */
export class MyForceGraph<V extends ForceGraphView<GraphSettingManager<GraphSetting, V>, ItemView>> {
  /**
   * this can be a local graph
   */
  public readonly view: V;
  // private config: LocalGraphSettings;

  public readonly instance: MyForceGraphInstance;

  public readonly interactionManager: ForceGraphEngine;
  public nodeLabelEl: HTMLDivElement;

  /**
   *
   * this will create a new force graph instance and render it to the view
   * @param view
   * @param config you have to provide the full config here!!
   */
  constructor(view: V, _graph: Graph) {
    this.view = view;
    this.interactionManager = new ForceGraphEngine(this);

    const pluginSetting = this.view.plugin.settingManager.getSettings().pluginSetting;
    const determineTooManyNode = () => {
      const tooMany = _graph.nodes.length > pluginSetting.maxNodeNumber;
      if (tooMany) createNotice(getTooManyNodeMessage(_graph.nodes.length));
    };

    determineTooManyNode();

    const graph = _graph;

    // create the div element for the node label
    const { divEl, nodeLabelEl } = this.createNodeLabel();
    this.nodeLabelEl = nodeLabelEl;
    // create the instance
    // these config will not changed by user
    this.instance = ForceGraph()(this.view.contentEl)
      .graphData(graph)
      .nodeColor(this.interactionManager.getNodeColor)
      // @ts-ignore
      .nodeLabel((node) => null)
      // node size is proportional to the number of links
      .nodeVal((node: Node) => {
        return (
          (node.links.length + 1) *
          // if the view has a currentFile, then it can be either local graph view or post processor view
          ("currentFile" in this.view && (this.view.currentFile as TFile)?.path === node.path
            ? 3
            : 1)
        );
      })
      .onBackgroundRightClick(() => {
        this.interactionManager.removeSelection();
      })
      .onNodeHover(this.interactionManager.onNodeHover)
      .onNodeDrag(this.interactionManager.onNodeDrag)
      .onNodeDragEnd(this.interactionManager.onNodeDragEnd)
      .onNodeRightClick(this.interactionManager.onNodeRightClick)
      .onNodeClick(this.interactionManager.onNodeClick)
      // .onLinkHover(this.interactionManager.onLinkHover)
      .linkColor(this.interactionManager.getLinkColor)
      .linkWidth(this.interactionManager.getLinkWidth)
      .linkDirectionalParticles(this.interactionManager.getLinkDirectionalParticles)
      .linkDirectionalParticleWidth(this.interactionManager.getLinkDirectionalParticleWidth)
      .linkDirectionalParticleColor(link => 'rgba(71, 30, 143, 0.25)')
      .linkDirectionalArrowLength(this.interactionManager.getLinkDirectionalArrowLength)
      .linkDirectionalArrowRelPos(1)
      // the options here are auto
      .width(this.view.contentEl.innerWidth)
      .height(this.view.contentEl.innerHeight)
      .d3Force("collide", d3.forceCollide(5))
      //   transparent
      .backgroundColor(hexToRGBA("#000000", 0)) as unknown as MyForceGraphInstance;

    // this.view.settingManager.getCurrentSetting().display.showCenterCoordinates
    this.instance.cooldownTicks(40)
      .onEngineStop(() => this.instance.zoomToFit(200, 50));

    // add node label
    this.instance
      .nodeCanvasObject((node: Node & Coords, ctx, globalScale) => {
        const text = this.interactionManager.getNodeLabelText(node);
        const fontSize = 16 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(text).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
        ctx.fillText(text, node.x, node.y);

        node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
      }).nodePointerAreaPaint((node: Node & Coords, color, ctx) => {
        ctx.fillStyle = color;
        const bckgDimensions = node.__bckgDimensions;
        bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, 
          ...bckgDimensions);

      }).linkCanvasObject((link: Link, ctx, globalScale: number) => {
        if (link.color === "parent") {
          return;
        }
        // Destructure the source and target coordinates
        var { x: x1, y: y1 } = link.source;
        var { x: x2, y: y2 } = link.target;
        if (!x1) {
          x1 = 0;
          y1 = 0;
          x2 = 0;
          y2 = 0;
        }

        // Set the starting width and ending width for the link
        const startWidth = 1;
        const endWidth = 20;

        // Calculate the length of the link
        const length = Math.hypot(x2 - x1, y2 - y1);

        // Save the current canvas state
        ctx.save();

        // Translate to the start point of the link
        ctx.translate(x1, y1);

        // Rotate the canvas to align with the link direction
        ctx.rotate(Math.atan2(y2 - y1, x2 - x1));

        // Create a gradient for the line width
        const gradient = ctx.createLinearGradient(0, 0, length, 0);
        gradient.addColorStop(0, 'rgba(71, 30, 143, 1)');  // Start color
        gradient.addColorStop(1, 'rgba(71, 30, 143, 0.25)');  // End color

        // Set the stroke style to the gradient
        ctx.strokeStyle = gradient;

        // Create a pattern for widening the link
        for (let i = 1; i < length; i++) {
          ctx.beginPath();
          ctx.lineWidth = startWidth + (endWidth - startWidth) * (i / length);
          ctx.moveTo(i-1, 0);
          ctx.lineTo(i, 0);
          ctx.stroke();
        }

        // Restore the canvas state
        ctx.restore();

      });

    // init other setting
    this.updateConfig(this.view.settingManager.getCurrentSetting());

    //  change the nav info text
    this.view.contentEl
      .querySelector(".scene-nav-info")
      ?.setText(
        `Left-click: rotate, Mouse-wheel/middle-click: zoom, ${
          pluginSetting.rightClickToPan ? "Right click" : "Cmd + left click"
        }: pan`
      );
  }

  private createNodeLabel() {
    const divEl = document.createElement("div");
    divEl.style.zIndex = "0";
    const nodeLabelEl = divEl.createDiv({
      cls: "node-label",
      text: "",
    });
    nodeLabelEl.style.opacity = "0";
    return { divEl, nodeLabelEl };
  }

  /**
   * update the dimensions of the graph
   */
  public updateDimensions(dimension?: [number, number]) {
    if (dimension) this.instance.width(dimension[0]).height(dimension[1]);
    else {
      const rootHtmlElement = this.view.contentEl as HTMLDivElement;
      const [width, height] = [rootHtmlElement.offsetWidth, rootHtmlElement.offsetHeight];
      this.instance.width(width).height(height);
    }
  }

  public updateConfig(config: DeepPartial<LocalGraphSettings>) {
    const { error } = syncOf(() => this.updateInstance(undefined, config));
    if (error) {
      console.error(error);
    }
  }

  /**
   * given a new force Graph, the update the graph and the instance
   */
  public updateGraph(graph: Graph) {
    // some optimization here
    // if the graph is the same, then we don't need to update the graph
    const same = Graph.compare(this.instance.graphData(), graph);
    if (!same) {
      const { error } = syncOf(() => this.updateInstance(graph, undefined));
      if (error) {
        console.error(error);
      }
    } else console.log("same graph, no need to update");
  }

  /**
   * given the changed things, update the instance
   */
  private updateInstance = (
    graph?: Graph,
    config?: DeepPartial<LocalGraphSettings>
  ) => {
    if (graph !== undefined) this.instance.graphData(graph);
    if (config?.display?.nodeSize !== undefined)
      this.instance.nodeRelSize(config.display?.nodeSize);
    if (config?.display?.linkDistance !== undefined) {
      this.instance.d3Force("link")?.distance(config.display?.linkDistance);
    }
    if (config?.display?.nodeRepulsion !== undefined) {
      this.instance.d3Force("charge")?.strength(-config.display?.nodeRepulsion);
      this.instance
        .d3Force("x", d3.forceX(0).strength(1 - config.display?.nodeRepulsion / 3000 + 0.001))
        .d3Force("y", d3.forceY(0).strength(1 - config.display?.nodeRepulsion / 3000 + 0.001));
    }

    if ((config as LocalGraphSettings)?.display?.dagOrientation !== undefined) {
      let dagOrientation = config?.display?.dagOrientation ?? DagOrientation.null;
      // check if graph is async or not
      if (
        !this.instance.graphData().isAcyclic() &&
        this.view.settingManager.getCurrentSetting().display.dagOrientation !== DagOrientation.null
      ) {
        createNotice("The graph is cyclic, dag orientation will be ignored");
        dagOrientation = DagOrientation.null;
      }

      const noDag = dagOrientation === DagOrientation.null;
      // @ts-ignore
      this.instance.dagMode(noDag ? null : config?.display.dagOrientation).dagLevelDistance(75);
    }

    /**
     * derive the need to reheat the simulation
     */
    const needReheat =
      config?.display?.nodeRepulsion !== undefined ||
      config?.display?.linkDistance !== undefined ||
      config?.display?.linkThickness !== undefined ||
      (config as LocalGraphSettings)?.display?.dagOrientation !== undefined;

    if (needReheat) {
      this.instance.d3ReheatSimulation();
    }
  };
}
