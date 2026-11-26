import type { Shape } from "../model/Shape.js";

/**
 * 扩展点：一种图形类型的创建与读回。
 * 接口在内核侧；内核不依赖具体实现类。
 */
export interface IShapeProvider {
  /** 稳定注册名，与 create / SVG 标签名一致，如 `rect` */
  readonly type: string;

  /** 由 CLI `create` 参数构造图形；参数非法时抛 `error: …` */
  create(id: string, params: string[]): Shape;

  /** 由 SVG 元素属性构造图形（read 路径） */
  fromSvg(id: string, attrs: Record<string, string>, textContent?: string): Shape;
}
