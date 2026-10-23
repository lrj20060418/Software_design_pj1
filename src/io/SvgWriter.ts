import * as fs from "node:fs";
import type { Document } from "../model/Document.js";

/**
 * 将 Document 序列化为 SVG 文本并写入文件。
 */
export class SvgWriter {
  /** @returns 写出的元素个数（含 g） */
  write(document: Document, filePath: string): number {
    const width = document.getWidth();
    const height = document.getHeight();
    const lines = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ];

    for (const root of document.getRoots()) {
      lines.push(...root.toSvgLines("  "));
    }
    lines.push(`</svg>`);
    lines.push("");

    try {
      fs.writeFileSync(filePath, lines.join("\n"), "utf8");
    } catch {
      throw new Error(`error: cannot write file: ${filePath}`);
    }

    return document.elementCount();
  }
}
