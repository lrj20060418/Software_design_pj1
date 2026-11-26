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

  complete(type: string, shape: Shape): void {
    this.shapes.get(type)?.complete?.(shape);
  }

  /**
   * 读盘时：若元素带 data-kind 且已注册对应 Provider，则用该逻辑类型；
   * 否则回落为 SVG 标签名（未装插件时 data-kind 复合图形降级为普通 g）。
   */
  resolveReadType(tag: string, attrs: Record<string, string>): string {
    const kind = attrs["data-kind"];
    if (kind && this.shapes.has(kind)) {
      return kind;
    }
    return tag;
  }
}
