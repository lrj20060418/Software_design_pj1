import { Shape } from "./Shape.js";

/**
 * 容器节点 `<g>`：Composite 的「组合」角色。
 */
export class Group extends Shape {
  private readonly children: Shape[] = [];

  getType(): string {
    return "g";
  }

  override canUngroup(): boolean {
    return true;
  }

  getChildren(): readonly Shape[] {
    return this.children;
  }

  clearChildren(): Shape[] {
    return this.children.splice(0, this.children.length);
  }

  addChild(shape: Shape): void {
    this.children.push(shape);
  }

  removeChild(shape: Shape): boolean {
    const index = this.children.indexOf(shape);
    if (index < 0) {
      return false;
    }
    this.children.splice(index, 1);
    return true;
  }

  insertChildAt(shape: Shape, index: number): void {
    const clamped = Math.max(0, Math.min(index, this.children.length));
    this.children.splice(clamped, 0, shape);
  }

  indexOfChild(shape: Shape): number {
    return this.children.indexOf(shape);
  }

  describePosition(): string {
    return "";
  }

  move(dx: number, dy: number): void {
    for (const child of this.children) {
      child.move(dx, dy);
    }
  }

  scale(factor: number): void {
    for (const child of this.children) {
      child.scale(factor);
    }
  }

  setAttribute(attr: string, _value: string | undefined): void {
    throw new Error(`error: unknown attribute: ${attr}`);
  }

  getAttribute(attr: string): string | undefined {
    throw new Error(`error: unknown attribute: ${attr}`);
  }

  toTreeLine(indent: string, isLast: boolean): string[] {
    const branch = isLast ? "└── " : "├── ";
    const lines = [`${indent}${branch}g#${this.id}`];
    const childIndent = indent + (isLast ? "    " : "│   ");
    this.children.forEach((child, index) => {
      const last = index === this.children.length - 1;
      lines.push(...child.toTreeLine(childIndent, last));
    });
    return lines;
  }

  toShowLines(parentRef: string): string[] {
    return [
      `g#${this.id}  parent=${parentRef}`,
      `  children=${this.children.length}`,
    ];
  }
}
