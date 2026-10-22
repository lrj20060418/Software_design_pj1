import { Document } from "../model/Document.js";

/**
 * 将 .svg 文件解析为 Document（缺 id 时自动补全并收集 warning）。
 * 依赖 model，不依赖 cli / commands。
 */
export class SvgReader {
  read(_filePath: string, _document: Document): string[] {
    // TODO: 解析 XML → 图形树；返回 warning 列表
    throw new Error("error: SvgReader not implemented yet");
  }
}
