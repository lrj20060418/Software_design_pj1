import type { Document } from "../../../src/model/Document.js";
import type { Shape } from "../../../src/model/Shape.js";
import { Group } from "../../../src/model/Group.js";

/**
 * 节点自身内容指纹（不含子孙几何/样式，避免「祖先误标 *」）。
 * 容器仅记录类型、id 与子 id 列表（结构变化仍可使容器 dirty）。
 */
export function fingerprintShape(shape: Shape): string {
  if (shape instanceof Group) {
    const childIds = shape.getChildren().map((c) => c.getId()).join(",");
    return `${shape.getType()}#${shape.getId()}[${childIds}]`;
  }
  return shape.toSvgLines("").join("\n");
}

export function collectFingerprints(document: Document): Map<string, string> {
  const map = new Map<string, string>();
  for (const shape of collectAllShapes(document)) {
    map.set(shape.getId(), fingerprintShape(shape));
  }
  return map;
}

export function collectAllShapes(document: Document): Shape[] {
  const list: Shape[] = [];
  const visit = (shape: Shape): void => {
    list.push(shape);
    if (shape instanceof Group) {
      for (const child of shape.getChildren()) {
        visit(child);
      }
    }
  };
  for (const root of document.getRoots()) {
    visit(root);
  }
  return list;
}
