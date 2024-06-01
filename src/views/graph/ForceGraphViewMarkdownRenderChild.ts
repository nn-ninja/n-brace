import type ForceGraphPlugin from "@/main";
import { PostProcessorForceGraphView } from "@/views/graph/forceview/PostProcessorForceGraphView";
import type { MarkdownPostProcessorContext, MarkdownView } from "obsidian";
import { MarkdownRenderChild } from "obsidian";

export class ForceGraphViewMarkdownRenderChild extends MarkdownRenderChild {
  plugin: ForceGraphPlugin;
  source: string;
  ctx: MarkdownPostProcessorContext;
  markdownView: MarkdownView;

  // Add a property for the ResizeObserver
  resizeObserver: ResizeObserver;

  ForceGraphView: PostProcessorForceGraphView;

  constructor(
    contentEl: HTMLElement,
    plugin: ForceGraphPlugin,
    source: string,
    ctx: MarkdownPostProcessorContext,
    markdownView: MarkdownView
  ) {
    super(contentEl);
    this.plugin = plugin;
    this.source = source;
    this.ctx = ctx;
    this.markdownView = markdownView;

    // Initialize the ResizeObserver to call the onResize method
    this.resizeObserver = new ResizeObserver((entries) => {
      // For this example, we're only observing the first entry (contentEl)
      this.onResize(entries[0]!);
    });

    // Start observing the content element
    this.resizeObserver.observe(contentEl);

    this.ForceGraphView = PostProcessorForceGraphView.new(
      this.plugin,
      this.containerEl,
      this.markdownView,
      this
    );
  }

  onload(): void {
    super.onload();
    this.plugin.activeGraphViews.push(this.ForceGraphView);
  }

  onunload(): void {
    super.unload();
    // the unload is called when the markdown view doesn't exist anymore
    // change to another file doesn't count
    // close the file count
    // console.log("unload");
    this.resizeObserver.disconnect();
    // destroy the graph and remove from the active graph views
    this.ForceGraphView.getForceGraph().instance._destructor();
    this.plugin.activeGraphViews = this.plugin.activeGraphViews.filter(
      (view) => view !== this.ForceGraphView
    );
  }

  // The method to be called when contentEl is resized
  onResize(entry: ResizeObserverEntry): void {
    // You can access the new dimensions of contentEl like this:
    const { width } = entry.contentRect;

    // Perform any actions you need on resize here
    this.ForceGraphView.getForceGraph().updateDimensions([width, 300]);

    // If you need to redraw or adjust anything related to the plugin or content,
    // this is where you'd do it.
  }
}
