import { FuzzySuggestModal } from "obsidian";
import { Node } from "@/graph/Node";
import { Graph3dView } from "@/views/graph/3dView/Graph3dView";
import { Command, commands } from "@/commands/Command";

export class CommandModal extends FuzzySuggestModal<Command> {
  private nodes: Set<Node>;
  private view: Graph3dView;

  constructor(view: Graph3dView, selectedNodes: Set<Node>) {
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
