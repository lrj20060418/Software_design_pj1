import type { Document } from "../model/Document.js";

/**
 * 扩展点：一种文档导出格式（与 `save` 的 SVG 写出分离）。
 * 接口在内核侧；内核不依赖具体格式实现。
 */
export interface IDocumentExporter {
  /** 稳定格式名，如 `json`；对应 `export <format> <path>` */
  readonly format: string;

  /**
   * 将当前文档写出到 `filePath`。
   * 成功返回用户可见回显；失败抛 `error: …`。
   */
  export(document: Document, filePath: string): string;
}
