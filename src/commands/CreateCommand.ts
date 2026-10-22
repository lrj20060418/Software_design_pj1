import type { ICommand } from "./ICommand.js";
import type { Document } from "../model/Document.js";
import type { Shape } from "../model/Shape.js";

/**
 * 创建图形：一个 undo 单元（Exp-2 接通 undo 后即可回滚）。
 */
export class CreateCommand implements ICommand {
  constructor(
    private readonly document: Document,
    private readonly shape: Shape,
    private readonly containerId: string | undefined,
  ) {}

  execute(): string {
    this.document.addShape(this.shape, this.containerId);
    const type = this.shape.getType();
    const id = this.shape.getId();
    if (this.containerId !== undefined) {
      return `${type}#${id} created in g#${this.containerId}`;
    }
    return `${type}#${id} created`;
  }

  undo(): string {
    const id = this.shape.getId();
    const type = this.shape.getType();
    this.document.detachShape(id);
    return `${type}#${id} deleted`;
  }
}
