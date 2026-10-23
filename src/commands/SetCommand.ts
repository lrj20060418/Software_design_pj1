import type { ICommand } from "./ICommand.js";
import type { Shape } from "../model/Shape.js";

/**
 * 设置属性：白名单校验在 Shape.setAttribute / getAttribute；失败不入栈。
 */
export class SetCommand implements ICommand {
  private readonly previous: string | undefined;

  constructor(
    private readonly shape: Shape,
    private readonly attr: string,
    private readonly value: string,
  ) {
    this.previous = shape.getAttribute(attr);
  }

  execute(): string {
    this.shape.setAttribute(this.attr, this.value);
    return this.formatMessage(this.value);
  }

  undo(): string {
    this.shape.setAttribute(this.attr, this.previous);
    return this.formatMessage(this.previous);
  }

  private formatMessage(value: string | undefined): string {
    const type = this.shape.getType();
    const id = this.shape.getId();
    return `${type}#${id} updated: ${formatAttrValue(this.attr, value)}`;
  }
}

function formatAttrValue(attr: string, value: string | undefined): string {
  if (value === undefined) {
    return `${attr}=(none)`;
  }
  if (attr === "text") {
    return `text="${value}"`;
  }
  return `${attr}=${value}`;
}
