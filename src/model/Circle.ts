import { Shape } from "./Shape.js";

export class Circle extends Shape {
  private cx: number;
  private cy: number;
  private r: number;
  private fill: string | undefined;
  private stroke: string | undefined;
  private strokeWidth: string | undefined;

  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id);
    this.cx = cx;
    this.cy = cy;
    this.r = r;
    this.fill = fill;
  }

  getType(): string {
    return "circle";
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
    this.r *= factor;
  }

  setAttribute(attr: string, value: string | undefined): void {
    switch (attr) {
      case "cx":
        this.cx = Number(value);
        break;
      case "cy":
        this.cy = Number(value);
        break;
      case "r":
        this.r = Number(value);
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
      case "r":
        return String(this.r);
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
    let summary = `cx=${this.cx} cy=${this.cy} r=${this.r}`;
    if (this.fill !== undefined) {
      summary += ` fill=${this.fill}`;
    }
    return [`${indent}${branch}circle#${this.id}  ${summary}`];
  }

  toShowLines(parentRef: string): string[] {
    const lines = [
      `circle#${this.id}  parent=${parentRef}`,
      `  cx=${this.cx} cy=${this.cy} r=${this.r}`,
    ];
    const style = this.styleLine();
    if (style) {
      lines.push(style);
    }
    return lines;
  }

  toSvgLines(indent: string): string[] {
    return [
      `${indent}<circle${this.xmlAttr("id", this.id)}${this.xmlAttr("cx", this.cx)}${this.xmlAttr("cy", this.cy)}${this.xmlAttr("r", this.r)}${this.xmlAttr("fill", this.fill)}${this.xmlAttr("stroke", this.stroke)}${this.xmlAttr("stroke-width", this.strokeWidth)}/>`,
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
