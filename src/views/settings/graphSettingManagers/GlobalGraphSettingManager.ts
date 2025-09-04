import { State, StateChange } from "@/util/State";
import { GlobalGraphSettings } from "@/SettingsSchemas";
import { GlobalGraph3dView } from "@/views/graph/3dView/GlobalGraph3dView";
import { GSettingManager } from "@/views/settings/graphSettingManagers/GraphSettingsManager";

export class GlobalGraphSettingManager extends GSettingManager {
  protected graphView: GlobalGraph3dView;
  protected currentSetting: State<GlobalGraphSettings>;
  protected settingChanges: StateChange<unknown, GlobalGraphSettings>[] = [];

  constructor(parentView: GlobalGraph3dView) {
    super();
    this.graphView = parentView;
    this.currentSetting = new State(
      this.graphView.plugin.settingManager.getSettings().temporaryGlobalGraphSetting
    );
  }
}
