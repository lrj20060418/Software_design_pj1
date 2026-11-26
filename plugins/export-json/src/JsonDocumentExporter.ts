import * as fs from "node:fs";
import type { Document } from "../../../src/model/Document.js";
import type { Shape } from "../../../src/model/Shape.js";
import type { IDocumentExporter } from "../../../src/extensions/IDocumentExporter.js";

/**
 * 将文档结构导出为 JSON（大纲：type/id/children）。
 */
export class JsonDocumentExporter implements IDocumentExporter {
  readonly format = "json";

  export(document: Document, filePath: string): string {
    const payload = {
      width: document.getWidth(),
      height: document.getHeight(),
      roots: document.getRoots().map((s) => serializeShape(s)),
    };
    try {
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    } catch {
      throw new Error(`error: cannot write file: ${filePath}`);
    }
    return `exported json to ${filePath}`;
  }
}

function serializeShape(shape: Shape): Record<string, unknown> {
  const node: Record<string, unknown> = {
    type: shape.getType(),
    id: shape.getId(),
  };
  const children = getChildren(shape);
  if (children) {
    node.children = children.map(serializeShape);
  }
  return node;
}

function getChildren(shape: Shape): readonly Shape[] | null {
  if (!shape.isContainer()) {
    return null;
  }
  const candidate = shape as Shape & { getChildren?: () => readonly Shape[] };
  if (typeof candidate.getChildren !== "function") {
    return null;
  }
  return candidate.getChildren();
}
