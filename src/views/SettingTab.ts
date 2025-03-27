import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type ForceGraphPlugin from "@/main";
import { CommandClickNodeAction, SearchEngineType } from "@/SettingsSchemas";
import { DEFAULT_SETTING } from "@/SettingManager";
import { eventBus } from "@/util/EventBus";

const DEFAULT_NUMBER = DEFAULT_SETTING.pluginSetting.maxNodeNumber;
const DEFAULT_BASE_FOLDER = DEFAULT_SETTING.pluginSetting.baseFolder;
const DEFAULT_TITLE_FONT_SIZE = DEFAULT_SETTING.pluginSetting.titleFontSize;
export class SettingTab extends PluginSettingTab {
  plugin: ForceGraphPlugin;

  constructor(app: App, plugin: ForceGraphPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const pluginSetting = this.plugin.settingManager.getSettings().pluginSetting;
    const { containerEl } = this;

    containerEl.empty();
    containerEl.addClasses(["graph-3d-setting-tab"]);

    containerEl.createEl("h2", { text: "Settings" });

    // new Setting(containerEl)
    //   .setName("Maximum node number in graph")
    //   .setDesc(
    //     "The maximum number of nodes in the graph. Graphs that has more than this number will not be rendered so that your computer is protected from hanging."
    //   )
    //   .addText((text) => {
    //     text
    //       .setPlaceholder(`${DEFAULT_NUMBER}`)
    //       .setValue(String(pluginSetting.maxNodeNumber ?? DEFAULT_NUMBER))
    //       .onChange(async (value) => {
    //         // check if value is a number
    //         if (isNaN(Number(value)) || Number(value) === 0) {
    //           // set the error to the input
    //           text.inputEl.setCustomValidity("Please enter a non-zero number");
    //           this.plugin.settingManager.updateSettings((setting) => {
    //             setting.value.pluginSetting.maxNodeNumber = DEFAULT_NUMBER;
    //           });
    //         } else {
    //           // remove the error
    //           text.inputEl.setCustomValidity("");
    //           this.plugin.settingManager.updateSettings((setting) => {
    //             setting.value.pluginSetting.maxNodeNumber = Number(value);
    //           });
    //         }
    //         text.inputEl.reportValidity();
    //       });
    //     text.inputEl.setAttribute("type", "number");
    //     text.inputEl.setAttribute("min", "10");
    //     return text;
    //   });

    // new Setting(containerEl)
    //   .setName("Search Engine")
    //   .setDesc("Search engine determine how to parse the query string and return results.")
    //   .addDropdown((dropdown) => {
    //     dropdown
    //       .addOptions({
    //         [SearchEngineType.default]: SearchEngineType.default,
    //       })
    //       // you need to add options before set value
    //       .setValue(pluginSetting.searchEngine)
    //       .onChange(async (value: SearchEngineType) => {
    //         // update the json
    //         this.plugin.settingManager.updateSettings((setting) => {
    //           setting.value.pluginSetting.searchEngine = value;
    //         });
    //
    //         // update the plugin file manager
    //         this.plugin.fileManager.setSearchEngine();
    //       });
    //   });

    new Setting(containerEl)
      .setName("Base Folder")
      .setDesc("Base folder, within which the mind map can navigate.")
      .addText((text) => {
        text
          .setPlaceholder(`${DEFAULT_BASE_FOLDER}`)
          .setValue(String(pluginSetting.baseFolder ?? DEFAULT_BASE_FOLDER))
          .onChange(async (value) => {
            // check if value is a number
            if (!value.startsWith("/")) {
              // set the error to the input
              text.inputEl.setCustomValidity("Please enter absolute path (beginning with /).");
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.baseFolder = DEFAULT_BASE_FOLDER;
              });
            } else {
              // remove the error
              text.inputEl.setCustomValidity("");
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.baseFolder = value;
              });

              this.plugin.resetGlobalGraph(value);
            }
            text.inputEl.reportValidity();
          });
        text.inputEl.setAttribute("type", "string");
      });

    new Setting(containerEl)
      .setName("Note title font size")
      .setDesc("The font size of the title displayed on a graph node.")
      .addText((text) => {
        text
          .setPlaceholder(`${DEFAULT_TITLE_FONT_SIZE}`)
          .setValue(String(pluginSetting.titleFontSize ?? DEFAULT_TITLE_FONT_SIZE))
          .onChange(async (value) => {
            // check if value is a number
            if (isNaN(Number(value)) || Number(value) <= 0) {
              // set the error to the input
              text.inputEl.setCustomValidity("Please enter a number higher than 3");
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.titleFontSize = DEFAULT_TITLE_FONT_SIZE;
              });
            } else {
              text.inputEl.setCustomValidity("");
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.titleFontSize = Number(value);
                eventBus.trigger("settings-updated");
              });
            }
            text.inputEl.reportValidity();
          });
        text.inputEl.setAttribute("type", "number");
        text.inputEl.setAttribute("min", "4");
        return text;
      });

    // create an H2 element called "Controls"
    // containerEl.createEl("h2", { text: "Controls" });
  }
}
