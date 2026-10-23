import type { ICommand } from "./ICommand.js";
import type { Shape } from "../model/Shape.js";

/**
 * 等比缩放：factor 同乘到全部几何属性；容器经 Composite 递归到子孙。
 */
export class ScaleCommand implements ICommand {
  constructor(
    private readonly shape: Shape,
    private readonly factor: number,
  ) {}

  execute(): string {
    this.shape.scale(this.factor);
    const type = this.shape.getType();
    const id = this.shape.getId();
    return `${type}#${id} scaled by ${this.factor}`;
  }

  undo(): string {
    this.shape.scale(1 / this.factor);
    const type = this.shape.getType();
    const id = this.shape.getId();
    return `${type}#${id} scaled by ${1 / this.factor}`;
  }
}
