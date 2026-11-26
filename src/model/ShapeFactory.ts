import type { ShapeRegistry } from "../extensions/ShapeRegistry.js";
import type { Shape } from "./Shape.js";

/**
 * 图形创建门面：按类型名分派到已注册的 ShapeProvider。
 * 内核不枚举具体图形实现类。
 */
export class ShapeFactory {
  constructor(private readonly shapes: ShapeRegistry) {}

  create(type: string, id: string, params: string[]): Shape {
    return this.shapes.require(type).create(id, params);
  }

  fromSvg(
    tag: string,
    id: string,
    attrs: Record<string, string>,
    textContent = "",
  ): Shape {
    return this.shapes.require(tag).fromSvg(id, attrs, textContent);
  }

  supports(type: string): boolean {
    return this.shapes.has(type);
  }
}
