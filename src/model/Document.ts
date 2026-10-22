import { Shape } from "./Shape.js";
import { Group } from "./Group.js";

/**
 * 当前编辑会话的根：画布尺寸 + 图形树。
 * 不依赖 CLI / IO；由 commands 与 io 读写。
 */
export class Document {
  private width = 0;
  private height = 0;
  private ready = false;
  /** 读入路径，供无参 save 使用 */
  private sourcePath: string | null = null;

  private readonly shapes = new Map<string, Shape>();
  /** shape id → parent group id；根级为 null */
  private readonly parentIds = new Map<string, string | null>();
  private readonly roots: Shape[] = [];

  isReady(): boolean {
    return this.ready;
  }

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.ready = true;
    this.sourcePath = null;
    this.shapes.clear();
    this.parentIds.clear();
    this.roots.length = 0;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setSize(width: number, height: number): void {
    this.ensureReady();
    this.width = width;
    this.height = height;
  }

  getSourcePath(): string | null {
    return this.sourcePath;
  }

  setSourcePath(path: string | null): void {
    this.sourcePath = path;
  }

  ensureReady(): void {
    if (!this.ready) {
      throw new Error("error: no document. use 'init' or 'read' first");
    }
  }

  hasId(id: string): boolean {
    return this.shapes.has(id);
  }

  getShape(id: string): Shape | undefined {
    return this.shapes.get(id);
  }

  requireShape(id: string): Shape {
    const shape = this.shapes.get(id);
    if (!shape) {
      throw new Error(`error: no such shape: ${id}`);
    }
    return shape;
  }

  getParentId(id: string): string | null {
    const parent = this.parentIds.get(id);
    return parent === undefined ? null : parent;
  }

  getRoots(): readonly Shape[] {
    return this.roots;
  }

  /**
   * 将图形挂到根或指定 g 容器下。
   * @param containerId 省略则挂在画布根
   */
  addShape(shape: Shape, containerId?: string): void {
    this.ensureReady();
    const id = shape.getId();
    if (this.shapes.has(id)) {
      throw new Error(`error: id already exists: ${id}`);
    }

    if (containerId === undefined) {
      this.roots.push(shape);
      this.shapes.set(id, shape);
      this.parentIds.set(id, null);
      return;
    }

    const container = this.shapes.get(containerId);
    if (!container) {
      throw new Error(`error: no such container: ${containerId}`);
    }
    if (!(container instanceof Group)) {
      throw new Error(`error: not a container: ${containerId}`);
    }

    container.addChild(shape);
    this.shapes.set(id, shape);
    this.parentIds.set(id, containerId);
  }

  /** 供后续 undo 使用：从树与索引中移除（不递归删子孙的索引由调用方保证） */
  detachShape(id: string): Shape {
    const shape = this.requireShape(id);
    const parentId = this.parentIds.get(id) ?? null;

    if (parentId === null) {
      const index = this.roots.indexOf(shape);
      if (index >= 0) {
        this.roots.splice(index, 1);
      }
    } else {
      const parent = this.shapes.get(parentId);
      if (parent instanceof Group) {
        parent.removeChild(shape);
      }
    }

    this.shapes.delete(id);
    this.parentIds.delete(id);
    return shape;
  }

  parentRefOf(id: string): string {
    const parentId = this.parentIds.get(id);
    if (parentId === null || parentId === undefined) {
      return "svg";
    }
    return `g#${parentId}`;
  }

  renderTree(rootId?: string): string {
    this.ensureReady();

    if (rootId !== undefined) {
      const shape = this.requireShape(rootId);
      if (shape instanceof Group) {
        const lines = [`g#${shape.getId()}`];
        const children = shape.getChildren();
        children.forEach((child, index) => {
          const last = index === children.length - 1;
          lines.push(...child.toTreeLine("", last));
        });
        return lines.join("\n");
      }
      return shape.toTreeLine("", true).join("\n").replace(/^[└├]── /, "");
    }

    const lines = [`svg (${this.width}x${this.height})`];
    this.roots.forEach((child, index) => {
      const last = index === this.roots.length - 1;
      lines.push(...child.toTreeLine("", last));
    });
    return lines.join("\n");
  }

  renderShow(id: string): string {
    this.ensureReady();
    const shape = this.requireShape(id);
    return shape.toShowLines(this.parentRefOf(id)).join("\n");
  }
}
