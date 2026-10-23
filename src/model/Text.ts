import { Shape, escapeXml } from "./Shape.js";

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
  }

  setAttribute(attr: string, value: string | undefined): void {
    switch (attr) {
      case "x":
        this.x = Number(value);
        break;
      case "y":
        this.y = Number(value);
        break;
      case "text":
        if (value === undefined) {
          throw new Error(`error: unknown attribute: ${attr}`);
        }
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

  getAttribute(attr: string): string | undefined {
    switch (attr) {
      case "x":
        return String(this.x);
      case "y":
        return String(this.y);
      case "text":
        return this.content;
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

  toSvgLines(indent: string): string[] {
    return [
      `${indent}<text${this.xmlAttr("id", this.id)}${this.xmlAttr("x", this.x)}${this.xmlAttr("y", this.y)}${this.xmlAttr("fill", this.fill)}${this.xmlAttr("stroke", this.stroke)}${this.xmlAttr("stroke-width", this.strokeWidth)}>${escapeXml(this.content)}</text>`,
    ];
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
