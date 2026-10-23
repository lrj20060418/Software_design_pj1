import type { ICommand } from "./ICommand.js";
import type { Shape } from "../model/Shape.js";
import { Group } from "../model/Group.js";

/**
 * 平移：一条命令 = 一个 undo 单元；对 g 与叶子统一调用 Shape.move。
 */
export class MoveCommand implements ICommand {
  constructor(
    private readonly shape: Shape,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  execute(): string {
    this.shape.move(this.dx, this.dy);
    return this.formatMessage(false);
  }

  undo(): string {
    this.shape.move(-this.dx, -this.dy);
    return this.formatMessage(true);
  }

  private formatMessage(undone: boolean): string {
    const type = this.shape.getType();
    const id = this.shape.getId();
    if (this.shape instanceof Group) {
      const dx = undone ? -this.dx : this.dx;
      const dy = undone ? -this.dy : this.dy;
      const verb = undone ? "moved back by" : "moved by";
      return `${type}#${id} ${verb} (${dx},${dy})`;
    }
    const verb = undone ? "moved back to" : "moved to";
    return `${type}#${id} ${verb} ${this.shape.describePosition()}`;
  }
}
