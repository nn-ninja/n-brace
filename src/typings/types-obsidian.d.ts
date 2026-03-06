import "obsidian";
import type { SuggestModal, TFile, View, WorkspaceLeaf } from "obsidian";

interface InternalPlugins {
  switcher: QuickSwitcherPlugin;
  "page-preview": InternalPlugin;
  graph: GraphPlugin;
}

type SwitcherReturnType =
  | {
  downranked: boolean;
  file?: TFile;
  type: "file";
}
  | undefined;

declare class QuickSwitcherModal extends SuggestModal<TFile> {
  getSuggestions(query: string): SwitcherReturnType[] | Promise<SwitcherReturnType[]>;

  renderSuggestion(value: TFile, el: HTMLElement): unknown;

  onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent): unknown;
}

interface InternalPlugin {
  disable(): void;

  enable(): void;

  enabled: boolean;
  _loaded: boolean;
  instance: { name: string; id: string; [other: string]: any };
}

interface GraphPlugin extends InternalPlugin {
  views: { localgraph: (leaf: WorkspaceLeaf) => GraphView };
}

interface GraphView extends View {
  engine: typeof Object;
  renderer: { worker: { terminate(): void } };
}

interface QuickSwitcherPlugin extends InternalPlugin {
  instance: {
    name: string;
    id: string;
    QuickSwitcherModal: typeof QuickSwitcherModal;
  };
}

declare module "obsidian" {
  interface AppVaultConfig {
    userIgnoreFilters?: string[] | null;
  }

  interface Vault {
    config: AppVaultConfig;
  }

  interface Workspace {
    lastActiveFile: TFile;
  }


  interface App {
    commands: {
      listCommands(): Command[];
      findCommand(id: string): Command;
      removeCommand(id: string): void;
      executeCommandById(id: string): void;
      commands: Record<string, Command>;
    };
    internalPlugins: {
      plugins: InternalPlugins;
      getPluginById<T extends keyof InternalPlugins>(id: T): InternalPlugins[T];
    };
    plugins: {
      manifests: Record<string, PluginManifest>;
      plugins: Record<string, Plugin> & {
        ["recent-files-obsidian"]: Plugin & {
          shouldAddFile(file: TFile): boolean;
        };
      };
      getPlugin(id: string): Plugin;
      getPlugin(id: "calendar"): CalendarPlugin;
    };
    dom: { appContainerEl: HTMLElement };
    viewRegistry: ViewRegistry;

    openWithDefaultApp(path: string): void;
  }

  interface ViewRegistry {
    typeByExtension: Record<string, string>; // file extensions to view types
    viewByType: Record<string, (leaf: WorkspaceLeaf) => View>; // file extensions to view types
  }

  interface CalendarPlugin {
    view: View;
  }

  interface WorkspaceParent {
    insertChild(index: number, child: WorkspaceItem, resize?: boolean): void;

    replaceChild(index: number, child: WorkspaceItem, resize?: boolean): void;

    removeChild(leaf: WorkspaceLeaf, resize?: boolean): void;

    containerEl: HTMLElement;
    children: any;
  }

  interface WorkspaceLeaf {
    openLinkText(linkText: string, path: string, state?: unknown): Promise<void>;

    updateHeader(): void;

    containerEl: HTMLDivElement;
    working: boolean;
    parentSplit: WorkspaceParent;
    activeTime: number;
  }

  interface WorkspaceItem {
    side?: "left" | "right";
  }

  interface View {
    iconEl: HTMLElement;
    file: TFile;

    setMode(mode: MarkdownSubView): Promise<void>;

    followLinkUnderCursor(newLeaf: boolean): void;

    modes: Record<string, MarkdownSubView>;

    getMode(): string;

    headerEl: HTMLElement;
    contentEl: HTMLElement;
  }

  interface Plugin {
    registerGlobalCommand(command: Command): void;
  }
}
