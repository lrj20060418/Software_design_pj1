import { Shape } from "./Shape.js";

export class Text extends Shape {
  private x: number;
  private y: number;
  private content: string;
  private fill: string | undefined;
  private stroke: string | undefined;
  private strokeWidth: string | undefined;

  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this.x = x;
    this.y = y;
    this.content = content;
  }

  getType(): string {
    return "text";
  }

  getContent(): string {
    return this.content;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  setAttribute(attr: string, value: string): void {
    switch (attr) {
      case "x":
        this.x = Number(value);
        break;
      case "y":
        this.y = Number(value);
        break;
      case "text":
        this.content = value;
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

  toTreeLine(indent: string, isLast: boolean): string[] {
    const branch = isLast ? "└── " : "├── ";
    return [`${indent}${branch}text#${this.id}  (${this.x},${this.y}) "${this.content}"`];
  }

  toShowLines(parentRef: string): string[] {
    const lines = [
      `text#${this.id}  parent=${parentRef}`,
      `  x=${this.x} y=${this.y}`,
      `  text="${this.content}"`,
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
