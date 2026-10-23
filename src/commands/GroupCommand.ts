import type { ICommand } from "./ICommand.js";
import type { Document } from "../model/Document.js";
import { Group } from "../model/Group.js";

type Placement = { id: string; parentId: string | null; index: number };

/**
 * 新建 g 并收编已有图形（命令参数顺序 = 子节点顺序）。
 */
export class GroupCommand implements ICommand {
  private readonly placements: Placement[];
  private groupParentId: string | null = null;
  private groupIndex = 0;

  constructor(
    private readonly document: Document,
    private readonly newGid: string,
    private readonly memberIds: string[],
  ) {
    this.placements = memberIds.map((id) => ({
      id,
      parentId: document.getParentId(id),
      index: document.siblingIndex(id),
    }));
  }

  execute(): string {
    const first = this.placements[0];
    this.groupParentId = first.parentId;
    const sameParentBefore = this.placements.filter(
      (p) => p.parentId === first.parentId && p.index < first.index,
    );
    this.groupIndex = first.index - sameParentBefore.length;

    for (const p of this.placements) {
      this.document.unlinkFromParent(p.id);
    }

    const group = new Group(this.newGid);
    this.document.placeGroup(group, this.groupParentId, this.groupIndex);

    for (const p of this.placements) {
      this.document.linkToParent(p.id, this.newGid, group.getChildren().length);
    }

    return `g#${this.newGid} created with ${this.memberIds.length} children`;
  }

  undo(): string {
    for (const p of this.placements) {
      this.document.unlinkFromParent(p.id);
    }
    const group = this.document.unregisterGroupNode(this.newGid);
    group.clearChildren();

    const byParent = new Map<string | null, Placement[]>();
    for (const p of this.placements) {
      const list = byParent.get(p.parentId) ?? [];
      list.push(p);
      byParent.set(p.parentId, list);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.index - b.index);
      for (const p of list) {
        this.document.linkToParent(p.id, p.parentId, p.index);
      }
    }

    return `g#${this.newGid} dissolved`;
  }
}
