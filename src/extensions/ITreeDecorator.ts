import type { Document } from "../model/Document.js";
import type { Shape } from "../model/Shape.js";

/**
 * 扩展点：为结构树某一行追加/改写行尾标签。
 * 无装饰器注册时，`tree` 输出须与 Phase 1 逐字节一致。
 */
export interface ITreeDecorator {
  /** 稳定注册名，如 `modified-star` */
  readonly name: string;

  /**
   * @param line 原始行（含缩进与分支符）
   * @param shape 图形节点；画布根行 `svg (WxH)` 时为 `null`
   */
  decorate(
    line: string,
    context: { document: Document; shape: Shape | null },
  ): string;
}
