import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type ForceGraphPlugin from "@/main";
import { DEFAULT_SETTING } from "@/SettingManager";
import { eventBus } from "@/util/EventBus";
import type { GraphSettings } from "@/atoms/graphAtoms";
import { rgb } from "d3";

const DEFAULT_NUMBER = DEFAULT_SETTING.pluginSetting.maxNodeNumber;
const DEFAULT_BASE_FOLDER = DEFAULT_SETTING.pluginSetting.baseFolder;
const DEFAULT_TITLE_FONT_SIZE = DEFAULT_SETTING.pluginSetting.titleFontSize;
const DEFAULT_GRAPH_SPAN = DEFAULT_SETTING.pluginSetting.defaultGraphSpan;

export const LINK_IN_DARK_COLOR = DEFAULT_SETTING.pluginSetting.linkColorIn;
export const LINK_OUT_DARK_COLOR = DEFAULT_SETTING.pluginSetting.linkColorOut;
export const LINK_OTHER_DARK_COLOR = DEFAULT_SETTING.pluginSetting.linkColorOther;

export const LINK_IN_LIGHT_COLOR = "84, 168, 214";
export const LINK_OUT_LIGHT_COLOR = "220, 220, 0";
export const LINK_OTHER_LIGHT_COLOR = "119, 84, 168";
// let colorMode: "light" | "dark" | "custom" = "dark";

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
    containerEl.addClasses(["n-brace-setting-tab"]);

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
            if (isNaN(Number(value)) || Number(value) <= 3) {
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

    new Setting(containerEl)
      .setName("Default display graph span")
      .setDesc("Size of the graph that is displayed at once.")
      .addText((text) => {
        text
          .setPlaceholder(`${DEFAULT_GRAPH_SPAN}`)
          .setValue(String(pluginSetting.defaultGraphSpan ?? DEFAULT_GRAPH_SPAN))
          .onChange(async (value) => {
            // check if value is a number
            if (isNaN(Number(value)) || Number(value) <= 0) {
              // set the error to the input
              text.inputEl.setCustomValidity("Please enter a number higher than 0");
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.defaultGraphSpan = DEFAULT_GRAPH_SPAN;
              });
            } else {
              text.inputEl.setCustomValidity("");
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.defaultGraphSpan = Number(value);
                this.plugin.onGraphSettingAtomChanged(this.buildGraphSettings(setting));
              });
            }
            text.inputEl.reportValidity();
          });
        text.inputEl.setAttribute("type", "number");
        text.inputEl.setAttribute("min", "1");
        return text;
      });

    new Setting(containerEl)
      .setName("Link Color")
      .setDesc("Choose predefined colors or a custom color for graph links")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("light", "Light")
          .addOption("dark", "Dark")
          .addOption("custom", "Custom Color In & Out & Other")
          .setValue(pluginSetting.linkColorTheme)
          .onChange(async (value: "custom" | "light" | "dark") => {
            if (value === "dark") {
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.linkColorTheme = value;
                setting.value.pluginSetting.linkColorIn = LINK_IN_DARK_COLOR;
                setting.value.pluginSetting.linkColorOut = LINK_OUT_DARK_COLOR;
                setting.value.pluginSetting.linkColorOther = LINK_OTHER_DARK_COLOR;
                this.plugin.onGraphSettingAtomChanged(this.buildGraphSettings(setting));
              });
            } else if (value === "light") {
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.linkColorTheme = value;
                setting.value.pluginSetting.linkColorIn = LINK_IN_LIGHT_COLOR;
                setting.value.pluginSetting.linkColorOut = LINK_OUT_LIGHT_COLOR;
                setting.value.pluginSetting.linkColorOther = LINK_OTHER_LIGHT_COLOR;
                this.plugin.onGraphSettingAtomChanged(this.buildGraphSettings(setting));
              });
            } else {
              this.plugin.settingManager.updateSettings((setting) => {
                setting.value.pluginSetting.linkColorTheme = value;
              });
            }
            this.display();
          })
      )
      .addColorPicker((color) => {
        if (pluginSetting.linkColorTheme !== "custom") {
          color.setDisabled(true);
        }
        color
          .setValue(rgb(`rgb(${pluginSetting.linkColorIn})`).formatHex())
          .onChange(async (value) => {
            this.plugin.settingManager.updateSettings((setting) => {
              const rgbObj = rgb(value);
              setting.value.pluginSetting.linkColorIn = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;
              this.plugin.onGraphSettingAtomChanged(this.buildGraphSettings(setting));
            });
          });
      })
      .addColorPicker((color) => {
        if (pluginSetting.linkColorTheme !== "custom") {
          color.setDisabled(true);
        }
        color
          .setValue(rgb(`rgb(${pluginSetting.linkColorOut})`).formatHex())
          .onChange(async (value) => {
            this.plugin.settingManager.updateSettings((setting) => {
              const rgbObj = rgb(value);
              setting.value.pluginSetting.linkColorOut = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;
              this.plugin.onGraphSettingAtomChanged(this.buildGraphSettings(setting));
            });
          });
      })
      .addColorPicker((color) => {
        if (pluginSetting.linkColorTheme !== "custom") {
          color.setDisabled(true);
        }
        color
          .setValue(rgb(`rgb(${pluginSetting.linkColorOther})`).formatHex())
          .onChange(async (value) => {
            this.plugin.settingManager.updateSettings((setting) => {
              const rgbObj = rgb(value);
              setting.value.pluginSetting.linkColorOther = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;
              this.plugin.onGraphSettingAtomChanged(this.buildGraphSettings(setting));
            });
          });
      });

    // create an H2 element called "Controls"
    // containerEl.createEl("h2", { text: "Controls" });
  }

  private buildGraphSettings(setting): GraphSettings {
    return {
      graphSpan: setting.value.pluginSetting.defaultGraphSpan,
      linkColorIn: setting.value.pluginSetting.linkColorIn,
      linkColorOut: setting.value.pluginSetting.linkColorOut,
      linkColorOther: setting.value.pluginSetting.linkColorOther,
    };
  }
}
