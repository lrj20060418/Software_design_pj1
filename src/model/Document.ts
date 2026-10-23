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

  /** 已登记图形总数（含 g 与嵌套子孙），供 save/read 回显 */
  elementCount(): number {
    return this.shapes.size;
  }

  /**
   * 读入用：将已在内存中组好的子树挂到根并建立索引。
   * shape 若为 Group，其子节点须已挂在 children 上。
   */
  importRoot(shape: Shape): void {
    this.ensureReady();
    if (this.shapes.has(shape.getId())) {
      throw new Error(`error: id already exists: ${shape.getId()}`);
    }
    this.roots.push(shape);
    this.registerSubtree(shape, null);
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

  /** 供 CreateCommand.undo：从树与索引中移除单节点（不递归） */
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

  /**
   * 删除子树：从父容器摘下，并注销自身与全部子孙的 id 索引。
   * 对象树仍保留在返回的 shape 上，供 undo 恢复。
   */
  removeSubtree(id: string): { shape: Shape; parentId: string | null; index: number } {
    const shape = this.requireShape(id);
    const parentId = this.parentIds.get(id) ?? null;
    let index = 0;

    if (parentId === null) {
      index = this.roots.indexOf(shape);
      if (index >= 0) {
        this.roots.splice(index, 1);
      } else {
        index = 0;
      }
    } else {
      const parent = this.shapes.get(parentId);
      if (!(parent instanceof Group)) {
        throw new Error(`error: not a container: ${parentId}`);
      }
      index = parent.indexOfChild(shape);
      parent.removeChild(shape);
    }

    this.unregisterSubtree(shape);
    return { shape, parentId, index };
  }

  /** 将 removeSubtree 摘下的子树插回原位置并重建索引 */
  restoreSubtree(
    shape: Shape,
    parentId: string | null,
    index: number,
  ): void {
    this.ensureReady();
    if (this.shapes.has(shape.getId())) {
      throw new Error(`error: id already exists: ${shape.getId()}`);
    }

    if (parentId === null) {
      const clamped = Math.max(0, Math.min(index, this.roots.length));
      this.roots.splice(clamped, 0, shape);
      this.registerSubtree(shape, null);
      return;
    }

    const parent = this.shapes.get(parentId);
    if (!parent) {
      throw new Error(`error: no such container: ${parentId}`);
    }
    if (!(parent instanceof Group)) {
      throw new Error(`error: not a container: ${parentId}`);
    }

    parent.insertChildAt(shape, index);
    this.registerSubtree(shape, parentId);
  }

  /** 在同级兄弟中的下标（根级相对于 roots） */
  siblingIndex(id: string): number {
    const shape = this.requireShape(id);
    const parentId = this.parentIds.get(id) ?? null;
    if (parentId === null) {
      return this.roots.indexOf(shape);
    }
    const parent = this.shapes.get(parentId);
    if (!(parent instanceof Group)) {
      throw new Error(`error: not a container: ${parentId}`);
    }
    return parent.indexOfChild(shape);
  }

  /** ancestorId 是否为 descendantId 的祖先（含相等则 false） */
  isAncestorOf(ancestorId: string, descendantId: string): boolean {
    let current: string | null | undefined = this.parentIds.get(descendantId);
    while (current !== null && current !== undefined) {
      if (current === ancestorId) {
        return true;
      }
      current = this.parentIds.get(current);
    }
    return false;
  }

  /**
   * 仅从父容器/根摘下，保留 shapes 索引（用于 reparent）。
   */
  unlinkFromParent(id: string): { parentId: string | null; index: number } {
    const shape = this.requireShape(id);
    const parentId = this.parentIds.get(id) ?? null;
    let index = 0;

    if (parentId === null) {
      index = this.roots.indexOf(shape);
      if (index >= 0) {
        this.roots.splice(index, 1);
      } else {
        index = 0;
      }
    } else {
      const parent = this.shapes.get(parentId);
      if (!(parent instanceof Group)) {
        throw new Error(`error: not a container: ${parentId}`);
      }
      index = parent.indexOfChild(shape);
      parent.removeChild(shape);
    }

    return { parentId, index };
  }

  /** 挂到指定父级与下标；调用前 shape 须已在索引中且已 unlink */
  linkToParent(id: string, parentId: string | null, index: number): void {
    const shape = this.requireShape(id);

    if (parentId === null) {
      const clamped = Math.max(0, Math.min(index, this.roots.length));
      this.roots.splice(clamped, 0, shape);
      this.parentIds.set(id, null);
      return;
    }

    const parent = this.shapes.get(parentId);
    if (!parent) {
      throw new Error(`error: no such container: ${parentId}`);
    }
    if (!(parent instanceof Group)) {
      throw new Error(`error: not a container: ${parentId}`);
    }
    parent.insertChildAt(shape, index);
    this.parentIds.set(id, parentId);
  }

  /** 将已登记的空 Group 挂到父级（group 命令用） */
  placeGroup(group: Group, parentId: string | null, index: number): void {
    const id = group.getId();
    if (this.shapes.has(id)) {
      throw new Error(`error: id already exists: ${id}`);
    }
    this.shapes.set(id, group);
    this.linkToParent(id, parentId, index);
  }

  /** 仅注销 Group 自身（子节点须已提升走） */
  unregisterGroupNode(id: string): Group {
    const shape = this.requireShape(id);
    if (!(shape instanceof Group)) {
      throw new Error(`error: not a container: ${id}`);
    }
    this.unlinkFromParent(id);
    this.shapes.delete(id);
    this.parentIds.delete(id);
    return shape;
  }

  private registerSubtree(shape: Shape, parentId: string | null): void {
    const id = shape.getId();
    this.shapes.set(id, shape);
    this.parentIds.set(id, parentId);
    if (shape instanceof Group) {
      for (const child of shape.getChildren()) {
        this.registerSubtree(child, id);
      }
    }
  }

  private unregisterSubtree(shape: Shape): void {
    if (shape instanceof Group) {
      for (const child of shape.getChildren()) {
        this.unregisterSubtree(child);
      }
    }
    this.shapes.delete(shape.getId());
    this.parentIds.delete(shape.getId());
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
