import type { ICommand } from "./ICommand.js";
import type { Document } from "../model/Document.js";
import { Group } from "../model/Group.js";

/**
 * 把已有图形移入容器，作为最后一个子节点。
 */
export class AddToCommand implements ICommand {
  private prevParentId: string | null = null;
  private prevIndex = 0;

  constructor(
    private readonly document: Document,
    private readonly gid: string,
    private readonly id: string,
  ) {}

  execute(): string {
    const container = this.document.requireShape(this.gid);
    if (!(container instanceof Group)) {
      throw new Error(`error: not a container: ${this.gid}`);
    }
    this.document.requireShape(this.id);

    if (this.id === this.gid) {
      throw new Error(`error: cannot group a container into its own descendant: ${this.gid}`);
    }
    if (this.document.isAncestorOf(this.id, this.gid)) {
      throw new Error(`error: cannot group a container into its own descendant: ${this.id}`);
    }

    const prev = this.document.unlinkFromParent(this.id);
    this.prevParentId = prev.parentId;
    this.prevIndex = prev.index;

    const appendAt = container.getChildren().length;
    this.document.linkToParent(this.id, this.gid, appendAt);

    const shape = this.document.requireShape(this.id);
    return `${shape.getType()}#${this.id} added to g#${this.gid}`;
  }

  undo(): string {
    this.document.unlinkFromParent(this.id);
    this.document.linkToParent(this.id, this.prevParentId, this.prevIndex);
    const shape = this.document.requireShape(this.id);
    if (this.prevParentId === null) {
      return `${shape.getType()}#${this.id} restored`;
    }
    return `${shape.getType()}#${this.id} restored into g#${this.prevParentId}`;
  }
}
