import type { BaseForceGraphView } from "@/views/graph/forceview/ForceGraphView";
import type { Node } from "@/graph/Node";

export const deleteNote = (view: BaseForceGraphView, nodes: Set<Node>) => {
  const vault = view.plugin.app.vault;
  for (const node of nodes) {
    const file = vault.getAbstractFileByPath(node.path);
    if (file) {
      vault.trash(file, vault.config.trashOption === "system");
    }
  }
};
