import { PluginSettingManager } from "@/SettingManager";
import { State } from "@/util/State";
import type { MarkdownPostProcessorGraphSettings } from "@/SettingsSchemas";
import { GraphType } from "@/SettingsSchemas";
import type { PostProcessorForceGraphView } from "@/views/graph/forceview/PostProcessorForceGraphView";
import { GraphSettingManager } from "@/views/settings/graphSettingManagers/GraphSettingsManager";

export class PostProcessorGraphSettingManager extends GraphSettingManager<
  MarkdownPostProcessorGraphSettings,
  PostProcessorForceGraphView
> {
  protected currentSetting: State<MarkdownPostProcessorGraphSettings>;

  private constructor(parentView: PostProcessorForceGraphView) {
    super(parentView);
    this.currentSetting = new State(PluginSettingManager.getNewSetting(GraphType.postProcessor));
  }

  static new(parentView: PostProcessorForceGraphView) {
    const settingManager = new PostProcessorGraphSettingManager(parentView);
    settingManager.onReady();
    return settingManager;
  }
}
