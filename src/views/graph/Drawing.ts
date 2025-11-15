import type { GraphSettings } from "@/atoms/graphAtoms";
import type { Link } from "@/graph/Link";
import type { Node } from "@/graph/Node";

export class Drawing {
  private static readonly SELECTED_COLOR = "21, 0, 158";

  static drawLink(
    link: Link,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
    navDescending: boolean,
    graphSettings: GraphSettings
  ) {
    if (link.color === "parent") {
      return;
    }
    if (link.label === "para") {
      return Drawing.drawPara(link, ctx, navDescending);
    }
    // Destructure the source and target coordinates
    let { x: x1, y: y1 } = navDescending ? link.source : link.target;
    let { x: x2, y: y2 } = navDescending ? link.target : link.source;
    if (!x1) {
      x1 = 0;
      y1 = 0;
    }
    if (!x2) {
      x2 = 0;
      y2 = 0;
    }

    // Set the starting width and ending width for the link
    const startWidth = 1;
    const endWidth = 14;

    // Calculate the length of the link
    const length = Math.hypot(x2 - x1, y2 - y1);

    // Save the current canvas state
    ctx.save();

    // Translate to the start point of the link
    ctx.translate(x1, y1);

    // Rotate the canvas to align with the link direction
    ctx.rotate(Math.atan2(y2 - y1, x2 - x1));

    // const intensity = Math.pow(link.distance + 2, -0.6);
    const color =
      link.label === "parent"
        ? graphSettings.linkColorIn
        : link.label === "child"
          ? graphSettings.linkColorOut
          : link.label === "para"
            ? this.SELECTED_COLOR
            : graphSettings.linkColorOther;
    // Create a gradient for the line width
    const gradient = ctx.createLinearGradient(0, 0, length, 0);
    gradient.addColorStop(0, `rgba(${color}, 1`); // Start color 1
    gradient.addColorStop(1, `rgba(${color}, 0.5`); // End color 0.25

    // ctx.strokeStyle = `rgba(${color}, 1)`; // gradient;
    ctx.strokeStyle = gradient;

    // Create a pattern for widening the link
    for (let i = 1; i < length; i++) {
      ctx.beginPath();
      ctx.lineWidth = startWidth + (endWidth - startWidth) * (i / length);
      ctx.moveTo(i - 1, 0);
      ctx.lineTo(i, 0);
      ctx.stroke();
    }

    // Restore the canvas state
    ctx.restore();
  }

  static drawPara(
    link: Link,
    ctx: CanvasRenderingContext2D,
    navDescending: boolean,
  ) {
    // Destructure the source and target coordinates
    const { x: x1, y: y1 } = navDescending ? link.source : link.target;
    const { x: x2, y: y2 } = navDescending ? link.target : link.source;
    if (!x1) {
      return;
    }
    if (!x2) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = "rgba(150, 150, 150, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /**
   * Draw a custom node
   * @param node The node data
   * @param ctx The canvas rendering context
   * @param globalScale The global scale factor for scaling nodes
   */
  static drawNode(
    node: Node & Coords & NodeData,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
    titleFontSize: number,
    graphSettings: GraphSettings
  ) {

    if (node.label === 'para') {
      return Drawing.drawParagraphNode(node, ctx, globalScale, titleFontSize, graphSettings);
    }

    const label = node.name.contains(".")
      ? node.name.substring(0, node.name.length - 3)
      : node.name;
    const fontSize = titleFontSize / globalScale; // Scale font size
    ctx.font = `${fontSize}px Sans-Serif`;

    const color =
      node.selected
        ? this.SELECTED_COLOR
        : node.label === "parent"
          ? graphSettings.linkColorIn
          : node.label === "child"
            ? graphSettings.linkColorOut
            : graphSettings.linkColorOther;

    function setupExpandedStyle() {
      if (node.expanded) {
        ctx.setLineDash([]);
      } else {
        ctx.setLineDash([8, 4]);
      }
    }

    if (node.image) {
      const textWidth = ctx.measureText(label).width;
      const imgRadius = 8;
      const padding = 1;

      // Define node shape properties
      const totalWidth = textWidth + padding * 2;
      const height = fontSize + padding * 2;

      // Drawing.drawCircle();
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, imgRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.strokeStyle = `rgb(${color})`;
      ctx.lineWidth = 0.5; /// globalScale;
      setupExpandedStyle();
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(
        node.image,
        node.x - imgRadius,
        node.y - imgRadius,
        imgRadius * 2,
        imgRadius * 2
      );

      // Draw a rounded rectangle around the node
      ctx.fillStyle = "white";
      ctx.strokeStyle = `rgb(${color})`;
      ctx.lineWidth = 0.5;
      Drawing.drawRoundedRect(
        ctx,
        node.x - totalWidth / 2,
        node.y - imgRadius,
        totalWidth,
        height,
        2
      );

      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, node.x, node.y - imgRadius + height / 2, 128);

      node.nodeDims = [imgRadius * 2, imgRadius * 2];
    } else {
      const textWidth = ctx.measureText(label).width;
      const padding = 4;

      // Define node shape properties
      const totalWidth = textWidth + padding * 2;
      const height = fontSize + padding * 2;

      ctx.fillStyle = "white";
      ctx.strokeStyle = `rgb(${color})`;
      ctx.lineWidth = 1;
      setupExpandedStyle();
      Drawing.drawRoundedRect(
        ctx,
        node.x - totalWidth / 2,
        node.y - height / 2,
        totalWidth,
        height,
        4
      );

      // Draw the text inside the rectangle
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, node.x, node.y);

      node.nodeDims = [totalWidth, height];
    }
  }

  static drawParagraphNode(
    node: Node & Coords & NodeData,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
    bodyFontSize: number,
    graphSettings: GraphSettings
  ) {
    const text = node.name.contains(".")
      ? node.name.substring(0, node.name.length - 3)
      : node.name;
    const fontSize = bodyFontSize / globalScale;
    const lineHeight = fontSize * 1.3;

    ctx.font = `${fontSize}px Sans-Serif`;

    function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        if (ctx.measureText(testLine).width > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    }

    function getWidestString(
      ctx: CanvasRenderingContext2D,
      strings: string[]
    ): number {
      let maxWidth = 0;

      for (const s of strings) {
        const w = ctx.measureText(s).width;
        if (w > maxWidth) {
          maxWidth = w;
        }
      }

      return maxWidth;
    }

    const maxWidth = 180 / globalScale; // you can modify this
    const lines = wrapText(ctx, text, maxWidth);

    const padding = 6 / globalScale;
    const foldSize = 12 / globalScale;

    const width = getWidestString(ctx, lines) + padding * 2;
    const height = lines.length * lineHeight + padding * 2;

    const x = node.x - width / 2;
    const y = node.y - height / 2;

    const color =
      node.selected
        ? this.SELECTED_COLOR
        : node.label === "parent"
          ? graphSettings.linkColorIn
          : node.label === "child"
            ? graphSettings.linkColorOut
            : graphSettings.linkColorOther;

    // --- DRAW PARAGRAPH BOX WITH FOLDED CORNER ---
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width - foldSize, y);
    ctx.lineTo(x + width, y + foldSize);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();

    ctx.fillStyle = "white";
    ctx.strokeStyle = `rgb(${color})`;
    ctx.lineWidth = 2 / globalScale;
    ctx.fill();
    ctx.stroke();

    // --- DRAW THE FOLD ---
    ctx.beginPath();
    ctx.moveTo(x + width - foldSize, y);
    ctx.lineTo(x + width - foldSize, y + foldSize);
    ctx.lineTo(x + width, y + foldSize);
    ctx.closePath();

    ctx.fillStyle = "#f0f0f0";   // folded corner color
    ctx.fill();
    ctx.stroke();

    // --- DRAW TEXT ---
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let textY = y + 2 * padding;
    for (const line of lines) {
      ctx.fillText(line, x + padding, textY);
      textY += lineHeight;
    }

    node.nodeDims = [width, height];
  }

  /**
   * Draw a rounded rectangle
   * @param ctx The canvas rendering context
   * @param x The x-coordinate of the top-left corner
   * @param y The y-coordinate of the top-left corner
   * @param width The width of the rectangle
   * @param height The height of the rectangle
   * @param radius The corner radius
   */
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
