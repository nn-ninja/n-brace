import { GraphType } from "@/SettingsSchemas";
import type ForceGraphPlugin from "@/main";
import { LocalForceGraphView } from "@/views/graph/forceview/LocalForceGraphView";
import { GraphItemView } from "@/views/graph/GraphItemView";
import type { WorkspaceLeaf } from "obsidian";

export class LocalGraphItemView extends GraphItemView {
  graphType = GraphType.local as const;
  graphView: LocalForceGraphView;
  constructor(leaf: WorkspaceLeaf, plugin: ForceGraphPlugin) {
    super(leaf, plugin);
    this.graphView = LocalForceGraphView.new(this.plugin, this.contentEl as HTMLDivElement, this);
  }
}
