import type { ICommand } from "./ICommand.js";
import type { Document } from "../model/Document.js";

/** 同级移到最前（SVG 先绘 = 最后）。 */
export class BackCommand implements ICommand {
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
    this.document.linkToParent(this.id, this.parentId, 0);

    return `${shape.getType()}#${this.id} sent to back`;
  }

  undo(): string {
    const shape = this.document.requireShape(this.id);
    this.document.unlinkFromParent(this.id);
    this.document.linkToParent(this.id, this.parentId, this.prevIndex);
    return `${shape.getType()}#${this.id} z-order restored`;
  }
}
