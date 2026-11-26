import { Shape, escapeXml, type TreeLineDecorator } from "../../../src/model/Shape.js";

const DEFAULT_FILL = "#f5a623";

/**
 * 判断框菱形：序列化为 `<polygon data-kind="diamond" …/>`。
 * 几何用包围盒中心 (cx,cy) 与宽高 (w,h)。
 */
export class Diamond extends Shape {
  private cx: number;
  private cy: number;
  private width: number;
  private height: number;
  private fill: string | undefined;

  constructor(
    id: string,
    cx: number,
    cy: number,
    width: number,
    height: number,
    fill: string | undefined = DEFAULT_FILL,
  ) {
    super(id);
    this.cx = cx;
    this.cy = cy;
    this.width = width;
    this.height = height;
    this.fill = fill;
  }

  static fromAttrs(id: string, attrs: Record<string, string>): Diamond {
    const cx = Number(attrs["data-cx"] ?? attrs.cx);
    const cy = Number(attrs["data-cy"] ?? attrs.cy);
    const w = Number(attrs["data-w"] ?? attrs.width);
    const h = Number(attrs["data-h"] ?? attrs.height);
    if (![cx, cy, w, h].every((n) => Number.isFinite(n))) {
      throw new Error(`error: invalid diamond geometry: ${id}`);
    }
    const fill = attrs.fill;
    return new Diamond(id, cx, cy, w, h, fill === undefined ? DEFAULT_FILL : fill);
  }

  getType(): string {
    return "diamond";
  }

  describePosition(): string {
    return `(${this.cx},${this.cy})`;
  }

  move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  setAttribute(attr: string, value: string | undefined): void {
    switch (attr) {
      case "cx":
        this.cx = Number(value);
        break;
      case "cy":
        this.cy = Number(value);
        break;
      case "width":
        this.width = Number(value);
        break;
      case "height":
        this.height = Number(value);
        break;
      case "fill":
        this.fill = value;
        break;
      default:
        throw new Error(`error: unknown attribute: ${attr}`);
    }
  }

  getAttribute(attr: string): string | undefined {
    switch (attr) {
      case "cx":
        return String(this.cx);
      case "cy":
        return String(this.cy);
      case "width":
        return String(this.width);
      case "height":
        return String(this.height);
      case "fill":
        return this.fill;
      default:
        throw new Error(`error: unknown attribute: ${attr}`);
    }
  }

  /** 上、右、下、左 */
  points(): [number, number][] {
    const hw = this.width / 2;
    const hh = this.height / 2;
    return [
      [this.cx, this.cy - hh],
      [this.cx + hw, this.cy],
      [this.cx, this.cy + hh],
      [this.cx - hw, this.cy],
    ];
  }

  pointsAttr(): string {
    return this.points()
      .map(([x, y]) => `${x},${y}`)
      .join(" ");
  }

  override treeLabel(): string {
    let summary = `cx=${this.cx} cy=${this.cy} w=${this.width} h=${this.height}`;
    if (this.fill !== undefined) {
      summary += ` fill=${this.fill}`;
    }
    return `diamond#${this.id}  ${summary}`;
  }

  toTreeLine(
    indent: string,
    isLast: boolean,
    decorate?: TreeLineDecorator,
  ): string[] {
    const branch = isLast ? "└── " : "├── ";
    const line = `${indent}${branch}${this.treeLabel()}`;
    return [this.applyTreeDecorate(line, decorate)];
  }

  toShowLines(parentRef: string): string[] {
    const lines = [
      `diamond#${this.id}  parent=${parentRef}`,
      `  cx=${this.cx} cy=${this.cy} width=${this.width} height=${this.height}`,
    ];
    if (this.fill !== undefined) {
      lines.push(`  fill=${this.fill}`);
    }
    return lines;
  }

  toSvgLines(indent: string): string[] {
    const fill =
      this.fill !== undefined ? ` fill="${escapeXml(this.fill)}"` : "";
    return [
      `${indent}<polygon${this.xmlAttr("id", this.id)} data-kind="diamond"${this.xmlAttr("data-cx", this.cx)}${this.xmlAttr("data-cy", this.cy)}${this.xmlAttr("data-w", this.width)}${this.xmlAttr("data-h", this.height)} points="${escapeXml(this.pointsAttr())}"${fill}/>`,
    ];
  }
}
