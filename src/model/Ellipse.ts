import { Shape } from "./Shape.js";

export class Ellipse extends Shape {
  private cx: number;
  private cy: number;
  private rx: number;
  private ry: number;
  private fill: string | undefined;
  private stroke: string | undefined;
  private strokeWidth: string | undefined;

  constructor(
    id: string,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    fill?: string,
  ) {
    super(id);
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
    this.fill = fill;
  }

  getType(): string {
    return "ellipse";
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
    this.rx *= factor;
    this.ry *= factor;
  }

  setAttribute(attr: string, value: string | undefined): void {
    switch (attr) {
      case "cx":
        this.cx = Number(value);
        break;
      case "cy":
        this.cy = Number(value);
        break;
      case "rx":
        this.rx = Number(value);
        break;
      case "ry":
        this.ry = Number(value);
        break;
      case "fill":
        this.fill = value;
        break;
      case "stroke":
        this.stroke = value;
        break;
      case "stroke-width":
        this.strokeWidth = value;
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
      case "rx":
        return String(this.rx);
      case "ry":
        return String(this.ry);
      case "fill":
        return this.fill;
      case "stroke":
        return this.stroke;
      case "stroke-width":
        return this.strokeWidth;
      default:
        throw new Error(`error: unknown attribute: ${attr}`);
    }
  }

  toTreeLine(indent: string, isLast: boolean): string[] {
    const branch = isLast ? "└── " : "├── ";
    let summary = `cx=${this.cx} cy=${this.cy} rx=${this.rx} ry=${this.ry}`;
    if (this.fill !== undefined) {
      summary += ` fill=${this.fill}`;
    }
    return [`${indent}${branch}ellipse#${this.id}  ${summary}`];
  }

  toShowLines(parentRef: string): string[] {
    const lines = [
      `ellipse#${this.id}  parent=${parentRef}`,
      `  cx=${this.cx} cy=${this.cy} rx=${this.rx} ry=${this.ry}`,
    ];
    const style = this.styleLine();
    if (style) {
      lines.push(style);
    }
    return lines;
  }

  private styleLine(): string | null {
    const parts: string[] = [];
    if (this.fill !== undefined) {
      parts.push(`fill=${this.fill}`);
    }
    if (this.stroke !== undefined) {
      parts.push(`stroke=${this.stroke}`);
    }
    if (this.strokeWidth !== undefined) {
      parts.push(`stroke-width=${this.strokeWidth}`);
    }
    return parts.length > 0 ? `  ${parts.join(" ")}` : null;
  }
}
