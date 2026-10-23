import type { ICommand } from "./ICommand.js";
import type { Document } from "../model/Document.js";
import type { Shape } from "../model/Shape.js";

/**
 * 删除图形（容器含全部子孙）；undo 时插回原父级与原兄弟位置。
 */
export class DeleteCommand implements ICommand {
  private snapshot:
    | { shape: Shape; parentId: string | null; index: number }
    | null = null;

  constructor(
    private readonly document: Document,
    private readonly id: string,
  ) {}

  execute(): string {
    this.snapshot = this.document.removeSubtree(this.id);
    const type = this.snapshot.shape.getType();
    return `${type}#${this.id} deleted`;
  }

  undo(): string {
    if (!this.snapshot) {
      throw new Error("error: nothing to undo");
    }
    const { shape, parentId, index } = this.snapshot;
    this.document.restoreSubtree(shape, parentId, index);
    const type = shape.getType();
    if (parentId === null) {
      return `${type}#${this.id} restored`;
    }
    return `${type}#${this.id} restored into g#${parentId}`;
  }
}
