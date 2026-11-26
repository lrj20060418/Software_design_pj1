import type { Document } from "../../../src/model/Document.js";
import type { Shape } from "../../../src/model/Shape.js";
import type { ITreeDecorator } from "../../../src/extensions/ITreeDecorator.js";

/**
 * 为 box 容器行追加 ` (box)`。
 * 仅依赖 getType()==="box"，不依赖 modified-star，也不 import shape-box 包。
 */
export class BoxTypeLabelDecorator implements ITreeDecorator {
  readonly name = "box-type-label";

  decorate(
    line: string,
    context: { document: Document; shape: Shape | null },
  ): string {
    void context.document;
    if (context.shape?.getType() !== "box") {
      return line;
    }
    if (/\(box\)/.test(line)) {
      return line;
    }
    return `${line} (box)`;
  }
}
