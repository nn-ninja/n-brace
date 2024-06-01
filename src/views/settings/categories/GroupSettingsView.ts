import { addNodeGroups } from "@/views/settings/categories/addNodeGroups";
import { addNodeGroupButton } from "@/views/settings/categories/AddNodeGroupButton";
import type { BaseForceGraphView } from "@/views/graph/forceview/ForceGraphView";
import type { addSearchInput } from "@/views/atomics/addSearchInput";
import type { GroupSettings } from "@/SettingsSchemas";

export const GroupSettingsView = async (
  groupSettings: GroupSettings,
  containerEl: HTMLElement,
  view: BaseForceGraphView
) => {
  const searchInputs: Awaited<ReturnType<typeof addSearchInput>>[] = [];
  await addNodeGroups(groupSettings, containerEl, view, searchInputs);
  addNodeGroupButton(containerEl, view, searchInputs);

  const triggerSearch = () => {
    searchInputs.forEach((nodeGroup) => {
      nodeGroup?.triggerSearch();
    });
  };

  return {
    searchInputs,
    triggerSearch,
  };
};
