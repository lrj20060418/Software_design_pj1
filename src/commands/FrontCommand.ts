import type { ICommand } from "./ICommand.js";
import type { Document } from "../model/Document.js";
import { Group } from "../model/Group.js";

/** 同级移到最后（SVG 后绘 = 最前）。 */
export class FrontCommand implements ICommand {
  private parentId: string | null = null;
  private prevIndex = 0;

  constructor(
    private readonly document: Document,
    private readonly id: string,
  ) {}

  execute(): string {
    const shape = this.document.requireShape(this.id);
    this.parentId = this.document.getParentId(this.id);
    this.prevIndex = this.document.siblingIndex(this.id);

    this.document.unlinkFromParent(this.id);
    let appendAt: number;
    if (this.parentId === null) {
      appendAt = this.document.getRoots().length;
    } else {
      const parent = this.document.requireShape(this.parentId);
      if (!(parent instanceof Group)) {
        throw new Error(`error: not a container: ${this.parentId}`);
      }
      appendAt = parent.getChildren().length;
    }
    this.document.linkToParent(this.id, this.parentId, appendAt);

    return `${shape.getType()}#${this.id} brought to front`;
  }

  undo(): string {
    const shape = this.document.requireShape(this.id);
    this.document.unlinkFromParent(this.id);
    this.document.linkToParent(this.id, this.parentId, this.prevIndex);
    return `${shape.getType()}#${this.id} z-order restored`;
  }
}
