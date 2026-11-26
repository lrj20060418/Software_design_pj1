import type { Document } from "../model/Document.js";
import type { IAttributeHandler } from "./IAttributeHandler.js";

export class AttributeHandlerRegistry {
  private readonly handlers: IAttributeHandler[] = [];

  register(handler: IAttributeHandler): void {
    if (this.handlers.some((h) => h.name === handler.name)) {
      throw new Error(
        `error: duplicate registration: attributes/${handler.name}`,
      );
    }
    this.handlers.push(handler);
  }

  list(): readonly IAttributeHandler[] {
    return this.handlers;
  }

  unregister(name: string): boolean {
    const index = this.handlers.findIndex((h) => h.name === name);
    if (index < 0) {
      return false;
    }
    this.handlers.splice(index, 1);
    return true;
  }

  names(): string[] {
    return this.handlers.map((h) => h.name);
  }

  /** 返回所有声明负责该 (shapeId, attr) 的处理器 */
  findHandlers(
    shapeId: string,
    attr: string,
    document: Document,
  ): IAttributeHandler[] {
    return this.handlers.filter((h) => h.handles(shapeId, attr, document));
  }
}
