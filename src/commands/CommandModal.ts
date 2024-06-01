import { FuzzySuggestModal } from "obsidian";
import type { Node } from "@/graph/Node";
import type { BaseForceGraphView } from "@/views/graph/forceview/ForceGraphView";
import type { Command } from "@/commands/Command";
import { commands } from "@/commands/Command";

export class CommandModal extends FuzzySuggestModal<Command> {
  private nodes: Set<Node>;
  private view: BaseForceGraphView;

  constructor(view: BaseForceGraphView, selectedNodes: Set<Node>) {
    super(view.plugin.app);
    this.nodes = selectedNodes;
    this.view = view;
  }

  getItems() {
    return commands.filter((command) => command.showConditon?.(this.view, this.nodes) ?? true);
  }

  getItemText(command: Command): string {
    return command.title;
  }

  onChooseItem(command: Command, evt: MouseEvent | KeyboardEvent) {
    command.function(this.view, this.nodes);
  }
}
