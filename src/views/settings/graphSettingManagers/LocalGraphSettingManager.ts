import { State } from "@/util/State";
import type { LocalGraphSettings } from "@/SettingsSchemas";
import { type LocalForceGraphView } from "@/views/graph/forceview/LocalForceGraphView";
import { GraphSettingManager } from "@/views/settings/graphSettingManagers/GraphSettingsManager";

export class LocalGraphSettingManager extends GraphSettingManager<
  LocalGraphSettings,
  LocalForceGraphView
> {
  protected currentSetting: State<LocalGraphSettings>;

  private constructor(parentView: LocalForceGraphView) {
    super(parentView);
    const pluginSetting = parentView.plugin.settingManager.getSettings();
    this.currentSetting = new State(pluginSetting.temporaryLocalGraphSetting);
  }

  static new(parentView: LocalForceGraphView) {
    const settingManager = new LocalGraphSettingManager(parentView);
    settingManager.onReady();
    return settingManager;
  }
}
