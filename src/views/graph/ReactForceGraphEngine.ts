// import * as TWEEN from "@tweenjs/tween.js";
// import * as THREE from "three";
// import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import type { Node } from "@/graph/Node";
// import type { BaseForceGraph } from "@/views/graph/ForceGraph";
// import type { Link } from "@/graph/Link";
// import { CommandModal } from "@/commands/CommandModal";
// import { CommandClickNodeAction, GraphType } from "@/SettingsSchemas";
// import { createNotice } from "@/util/createNotice";
// import { hexToRGBA } from "@/util/hexToRGBA";
// import type { TFile } from "obsidian";
//
// const origin = new THREE.Vector3(0, 0, 0);
// const cameraLookAtCenterTransitionDuration = 1000;
// const LINK_PARTICLE_MULTIPLIER = 4;
// export const FOCAL_FROM_CAMERA = 400;
// const selectedColor = "#CCA700";
// const PARTICLE_FREQUECY = 4;
// const LINK_ARROW_WIDTH_MULTIPLIER = 5;
//
// /**
//  * this instance handle all the interaction. In other words, the interaction manager
//  */
// export class ReactForceGraphEngine {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   private tween: { [tweenId: string]: TWEEN.Tween<any> | undefined } = {};
//   private spaceDown = false;
//   private commandDown = false;
//   private selectedNodes = new Set<Node>();
//   /**
//    * the node connected to the hover node
//    */
//   public readonly highlightedNodes: Set<string> = new Set();
//   /**
//    * the links connected to the hover node
//    */
//   public readonly highlightedLinks: Set<Link> = new Set();
//   hoveredNode: Node | null = null;
//
//   // zooming
//   private isZooming = false;
//   private startZoomTimeout: Timer | undefined;
//   private endZoomTimeout: Timer | undefined;
//
//   public getNodeColor = (node: Node): string => {
//     let color: string;
//     const settings = this.forceGraph.view.settingManager.getCurrentSetting();
//     const theme = this.forceGraph.view.theme;
//     const searchResult = this.forceGraph.view.settingManager.searchResult;
//     if (this.selectedNodes.has(node)) {
//       color = selectedColor;
//     } else if (this.isHighlightedNode(node)) {
//       color =
//         node === this.hoveredNode
//           ? settings.display.nodeHoverColor
//           : settings.display.nodeHoverNeighbourColor;
//     } else {
//       color = theme.graphNode;
//       settings.groups.forEach((group, index) => {
//         if (group.query.trim().length === 0) return;
//         const searchStateGroup = searchResult.value.groups[index];
//         if (searchStateGroup) {
//           const searchGroupfilePaths = searchStateGroup.files.map((file) => file.path);
//
//           // if the node path is in the searchGroupfiles, change the color to group.color
//           if (searchGroupfilePaths.includes(node.path)) color = group.color;
//         }
//       });
//     }
//     const rgba = hexToRGBA(
//       color,
//       this.getIsAnyHighlighted() && !this.isHighlightedNode(node) ? 0.5 : 1
//     );
//     return rgba;
//   };
//
//   public isHighlightedNode = (node: Node): boolean => {
//     return this.highlightedNodes.has(node.id);
//   };
// }
