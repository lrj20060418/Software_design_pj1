import { Shape } from "./Shape.js";

export class Rect extends Shape {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private fill: string | undefined;
  private stroke: string | undefined;
  private strokeWidth: string | undefined;

  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill?: string,
  ) {
    super(id);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fill = fill;
  }

  getType(): string {
    return "rect";
  }

  describePosition(): string {
    return `(${this.x},${this.y})`;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  setAttribute(attr: string, value: string | undefined): void {
    switch (attr) {
      case "x":
        this.x = Number(value);
        break;
      case "y":
        this.y = Number(value);
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
      case "x":
        return String(this.x);
      case "y":
        return String(this.y);
      case "width":
        return String(this.width);
      case "height":
        return String(this.height);
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
    let summary = `x=${this.x} y=${this.y} w=${this.width} h=${this.height}`;
    if (this.fill !== undefined) {
      summary += ` fill=${this.fill}`;
    }
    return [`${indent}${branch}rect#${this.id}  ${summary}`];
  }

  toShowLines(parentRef: string): string[] {
    const lines = [
      `rect#${this.id}  parent=${parentRef}`,
      `  x=${this.x} y=${this.y} width=${this.width} height=${this.height}`,
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
