import { Shape } from "./Shape.js";

export class Line extends Shape {
  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;
  private stroke: string | undefined;
  private strokeWidth: string | undefined;

  constructor(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke?: string,
  ) {
    super(id);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.stroke = stroke;
  }

  getType(): string {
    return "line";
  }

  describePosition(): string {
    return `(${this.x1},${this.y1})`;
  }

  move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  scale(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  setAttribute(attr: string, value: string | undefined): void {
    switch (attr) {
      case "x1":
        this.x1 = Number(value);
        break;
      case "y1":
        this.y1 = Number(value);
        break;
      case "x2":
        this.x2 = Number(value);
        break;
      case "y2":
        this.y2 = Number(value);
        break;
      case "stroke":
        this.stroke = value;
        break;
      case "stroke-width":
        this.strokeWidth = value;
        break;
      case "fill":
        throw new Error(`error: unknown attribute: ${attr}`);
      default:
        throw new Error(`error: unknown attribute: ${attr}`);
    }
  }

  getAttribute(attr: string): string | undefined {
    switch (attr) {
      case "x1":
        return String(this.x1);
      case "y1":
        return String(this.y1);
      case "x2":
        return String(this.x2);
      case "y2":
        return String(this.y2);
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
    let summary = `(${this.x1},${this.y1}) -> (${this.x2},${this.y2})`;
    if (this.stroke !== undefined) {
      summary += ` stroke=${this.stroke}`;
    }
    return [`${indent}${branch}line#${this.id}  ${summary}`];
  }

  toShowLines(parentRef: string): string[] {
    const lines = [
      `line#${this.id}  parent=${parentRef}`,
      `  x1=${this.x1} y1=${this.y1} x2=${this.x2} y2=${this.y2}`,
    ];
    const style = this.styleLine();
    if (style) {
      lines.push(style);
    }
    return lines;
  }

  toSvgLines(indent: string): string[] {
    return [
      `${indent}<line${this.xmlAttr("id", this.id)}${this.xmlAttr("x1", this.x1)}${this.xmlAttr("y1", this.y1)}${this.xmlAttr("x2", this.x2)}${this.xmlAttr("y2", this.y2)}${this.xmlAttr("stroke", this.stroke)}${this.xmlAttr("stroke-width", this.strokeWidth)}/>`,
    ];
  }

  private styleLine(): string | null {
    const parts: string[] = [];
    if (this.stroke !== undefined) {
      parts.push(`stroke=${this.stroke}`);
    }
    if (this.strokeWidth !== undefined) {
      parts.push(`stroke-width=${this.strokeWidth}`);
    }
    return parts.length > 0 ? `  ${parts.join(" ")}` : null;
  }
}
