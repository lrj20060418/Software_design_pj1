import type { ICommand } from "./ICommand.js";
import type {
  AttributeHandlerContext,
  AttributeUndoState,
  IAttributeHandler,
} from "../extensions/IAttributeHandler.js";

/**
 * 将一次 AttributeHandler 修改封装为单个 undo/redo 单元。
 * 构造时先 capture；execute 内 apply，失败则 restore 并抛错（不入栈由 History 保证）。
 */
export class AttributeHandlerCommand implements ICommand {
  private readonly before: AttributeUndoState;
  private readonly shapeType: string;

  constructor(
    private readonly handler: IAttributeHandler,
    private readonly ctx: AttributeHandlerContext,
  ) {
    this.before = handler.captureUndoState(ctx);
    const shape = ctx.document.requireShape(ctx.shapeId);
    this.shapeType = shape.getType();
  }

  execute(): string {
    try {
      this.handler.apply(this.ctx);
    } catch (err) {
      this.handler.restoreUndoState(this.before);
      throw err;
    }
    return this.formatMessage(this.ctx.value);
  }

  undo(): string {
    this.handler.restoreUndoState(this.before);
    // 回显：恢复后的「当前」语义值由处理器快照决定；消息用 apply 前的展示约定
    return this.formatMessage(this.describeRestored());
  }

  private describeRestored(): string | undefined {
    // 消息尽量可读；具体属性可能作用在子部件上
    return `(restored via ${this.handler.name})`;
  }

  private formatMessage(value: string | undefined): string {
    const id = this.ctx.shapeId;
    const attr = this.ctx.attr;
    if (value === undefined) {
      return `${this.shapeType}#${id} updated: ${attr}=(none)`;
    }
    if (attr === "text" || attr === "label") {
      return `${this.shapeType}#${id} updated: ${attr}="${value}"`;
    }
    return `${this.shapeType}#${id} updated: ${attr}=${value}`;
  }
}
