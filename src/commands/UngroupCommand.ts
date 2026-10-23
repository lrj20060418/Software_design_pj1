import type { ICommand } from "./ICommand.js";
import type { Document } from "../model/Document.js";
import { Group } from "../model/Group.js";

/**
 * 解散非根级 g：子节点提升到原父级、占据原 g 的位置。
 */
export class UngroupCommand implements ICommand {
  private childIds: string[] = [];
  private groupParentId: string | null = null;
  private groupIndex = 0;

  constructor(
    private readonly document: Document,
    private readonly gid: string,
  ) {}

  execute(): string {
    const shape = this.document.requireShape(this.gid);
    if (!(shape instanceof Group)) {
      throw new Error(`error: not a container: ${this.gid}`);
    }
    if (!shape.canUngroup()) {
      throw new Error(`error: cannot ungroup composite shape: ${this.gid}`);
    }

    this.groupParentId = this.document.getParentId(this.gid);
    if (this.groupParentId === null) {
      throw new Error(`error: cannot ungroup top-level container: ${this.gid}`);
    }

    this.groupIndex = this.document.siblingIndex(this.gid);
    this.childIds = shape.getChildren().map((c) => c.getId());

    for (const id of this.childIds) {
      this.document.unlinkFromParent(id);
    }
    shape.clearChildren();
    this.document.unregisterGroupNode(this.gid);

    for (let i = 0; i < this.childIds.length; i++) {
      this.document.linkToParent(
        this.childIds[i],
        this.groupParentId,
        this.groupIndex + i,
      );
    }

    return `g#${this.gid} ungrouped`;
  }

  undo(): string {
    for (const id of this.childIds) {
      this.document.unlinkFromParent(id);
    }

    const group = new Group(this.gid);
    this.document.placeGroup(group, this.groupParentId, this.groupIndex);

    for (const id of this.childIds) {
      this.document.linkToParent(id, this.gid, group.getChildren().length);
    }

    return `g#${this.gid} created with ${this.childIds.length} children`;
  }
}
