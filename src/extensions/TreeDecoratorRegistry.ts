import type { Document } from "../model/Document.js";
import type { TreeLineDecorator } from "../model/Shape.js";
import type { ITreeDecorator } from "./ITreeDecorator.js";

export class TreeDecoratorRegistry {
  private readonly decorators: ITreeDecorator[] = [];

  register(decorator: ITreeDecorator): void {
    if (this.decorators.some((d) => d.name === decorator.name)) {
      throw new Error(
        `error: duplicate registration: decorators/${decorator.name}`,
      );
    }
    this.decorators.push(decorator);
  }

  list(): readonly ITreeDecorator[] {
    return this.decorators;
  }

  unregister(name: string): boolean {
    const index = this.decorators.findIndex((d) => d.name === name);
    if (index < 0) {
      return false;
    }
    this.decorators.splice(index, 1);
    return true;
  }

  names(): string[] {
    return this.decorators.map((d) => d.name);
  }

  /**
   * 无装饰器时返回 `undefined`，使 tree 走 Phase 1 原路径（逐字节不变）。
   */
  createLineHook(document: Document): TreeLineDecorator | undefined {
    if (this.decorators.length === 0) {
      return undefined;
    }
    const active = [...this.decorators];
    return (shape, line): string => {
      let result = line;
      for (const decorator of active) {
        result = decorator.decorate(result, { document, shape });
      }
      return result;
    };
  }
}
