import type { GraphSettings } from "@/atoms/graphAtoms";
import type { Link } from "@/graph/Link";
import type { Node } from "@/graph/Node";

export class Drawing {
  private static readonly SELECTED_COLOR = "255, 215, 0";

  static drawLink(
    link: Link,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
    navDescending: boolean,
    graphSettings: GraphSettings,
    tagColorMap?: Map<string, string>,
    uncheckedTags?: Set<string>
  ) {
    if (link.color === "parent") {
      return;
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
          : graphSettings.linkColorOther;
    // Color edge only by tags shared between source and target
    const sourceTags = link.source.tags ?? [];
    const targetTags = link.target.tags ?? [];
    const sumTags = [...new Set([...sourceTags, ...targetTags])];
    const coloringTags = uncheckedTags
      ? sumTags.filter((t) => !uncheckedTags.has(t))
      : sumTags;
    const tagColors = tagColorMap
      ? coloringTags.map((t) => tagColorMap.get(t)).filter((c): c is string => c !== undefined)
      : [];

    if (tagColors.length > 0) {
      // Draw multi-color striped taper – one horizontal stripe per tag
      const n = tagColors.length;
      const bandHeight = endWidth / n;
      for (let i = 0; i < n; i++) {
        const yTopEnd = -endWidth / 2 + i * bandHeight;
        const yBotEnd = yTopEnd + bandHeight;
        // Interpolate start-width band proportionally
        const yTopStart = -startWidth / 2 + (i / n) * startWidth;
        const yBotStart = -startWidth / 2 + ((i + 1) / n) * startWidth;

        const tagColor = tagColors[i] ?? "#9e9e9e";
        const gradient = ctx.createLinearGradient(0, 0, length, 0);
        gradient.addColorStop(0, tagColor);
        gradient.addColorStop(1, Drawing.hexToRgba(tagColor, 0.5));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, yTopStart);
        ctx.lineTo(length, yTopEnd);
        ctx.lineTo(length, yBotEnd);
        ctx.lineTo(0, yBotStart);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Default gradient fill
      const gradient = ctx.createLinearGradient(0, 0, length, 0);
      gradient.addColorStop(0, `rgba(${graphSettings.linkColorOther}, 1)`);
      gradient.addColorStop(1, `rgba(${graphSettings.linkColorOther}, 0.5)`);

      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(0, -startWidth / 2);
      ctx.lineTo(length, -endWidth / 2);
      ctx.lineTo(length, endWidth / 2);
      ctx.lineTo(0, startWidth / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Stroke outline with dash pattern for child/parent edges
    if (link.label === "child" || link.label === "parent") {
      // Re-draw the full outer taper path so stroke covers the whole shape
      ctx.beginPath();
      ctx.moveTo(0, -startWidth / 2);
      ctx.lineTo(length, -endWidth / 2);
      ctx.lineTo(length, endWidth / 2);
      ctx.lineTo(0, startWidth / 2);
      ctx.closePath();

      ctx.strokeStyle = `rgba(${color}, 1.0)`;
      ctx.lineWidth = 0.6;
      if (link.label === "child") {
        ctx.setLineDash([2, 4]);
      } else {
        ctx.setLineDash([8, 4]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw 3 chevrons pointing from parent toward child (along +x in rotated space)
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.strokeStyle = `rgba(${color}, 1.0)`;
    const chevSize = 2.0;
    for (const t of [0.4, 0.5, 0.6]) {
      const cx = t * length;
      ctx.beginPath();
      ctx.moveTo(cx - chevSize, -chevSize);
      ctx.lineTo(cx, 0);
      ctx.lineTo(cx - chevSize, chevSize);
      ctx.stroke();
    }

    // Restore the canvas state
    ctx.restore();
  }

  // Draw a glowing rectangle between two nodes sharing a tag.
  // Inset at both ends so the rect is fully hidden under the node clouds.
  static drawTagEdge(
    x1: number, y1: number,
    x2: number, y2: number,
    cloudRadius: number,
    color: string,
    ctx: CanvasRenderingContext2D
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) return;

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(Math.atan2(dy, dx));

    const halfW = cloudRadius;
    const grad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    grad.addColorStop(0, Drawing.hexToRgba(color, 0));
    grad.addColorStop(0.1, Drawing.hexToRgba(color, 1.0));
    grad.addColorStop(0.9, Drawing.hexToRgba(color, 1.0));
    grad.addColorStop(1, Drawing.hexToRgba(color, 0));

    ctx.fillStyle = grad;
    ctx.fillRect(0, -halfW, dist, halfW * 2);

    ctx.restore();
  }

  // nodeHalfDiag: half-diagonal of the node bounding box in graph coords
  static drawNodeTagCloud(
    node: Node & Coords,
    ctx: CanvasRenderingContext2D,
    nodeHalfDiag: number,
    tagColorMap: Map<string, string>,
    uncheckedTags: Set<string>
  ) {
    const nodeTags = (node.tags ?? []).filter((t) => !uncheckedTags.has(t));
    const tagColors = nodeTags
      .map((t) => tagColorMap.get(t))
      .filter((c): c is string => c !== undefined);

    if (tagColors.length === 0) return;

    const cx = node.x!;
    const cy = node.y!;
    const n = tagColors.length;
    const angleStep = (2 * Math.PI) / n;

    // Circle is 2× the node half-diagonal; color visible only in the outer 10% ring
    const cloudRadius = nodeHalfDiag * 2;

    ctx.save();
    for (let i = 0; i < n; i++) {
      const startAngle = i * angleStep - Math.PI / 2;
      const endAngle = startAngle + angleStep;
      const color = tagColors[i]!;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cloudRadius);
      grad.addColorStop(0, Drawing.hexToRgba(color, 1.0));
      grad.addColorStop(0.9, Drawing.hexToRgba(color, 1.0));
      grad.addColorStop(1, Drawing.hexToRgba(color, 0));

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, cloudRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
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

  private static hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
