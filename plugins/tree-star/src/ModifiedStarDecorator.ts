import type { Document } from "../../../src/model/Document.js";
import type { Shape } from "../../../src/model/Shape.js";
import type { ITreeDecorator } from "../../../src/extensions/ITreeDecorator.js";
import {
  collectAllShapes,
  collectFingerprints,
  fingerprintShape,
} from "./shapeFingerprint.js";

/**
 * 为相对「上次保存/读入/init」内容有变化的节点追加 ` *`。
 *
 * ADR-0003 取舍：
 * - dirty = 内容指纹 ≠ 基线（undo 回保存点后 * 消失）
 * - 不向祖先传播（仅被改节点 + 画布根行在「文档有任一 dirty」时标 *）
 * - 新建节点立即 dirty（基线中无该 id）
 */
export class ModifiedStarDecorator implements ITreeDecorator {
  readonly name = "modified-star";

  /** 实例字段：id → 指纹；禁止模块级变量 */
  private baseline = new Map<string, string>();
  private hasBaseline = false;

  onAfterSave(document: Document): void {
    this.captureBaseline(document);
  }

  onAfterReset(document: Document): void {
    this.captureBaseline(document);
  }

  decorate(
    line: string,
    context: { document: Document; shape: Shape | null },
  ): string {
    if (!this.hasBaseline) {
      // 尚未 init/read/save：不标星，避免空基线误标
      return line;
    }

    if (context.shape === null) {
      return this.isDocumentDirty(context.document) ? `${line} *` : line;
    }

    return this.isShapeDirty(context.shape) ? `${line} *` : line;
  }

  /** 供独立状态机测试 */
  isShapeDirtyPublic(shape: Shape): boolean {
    return this.isShapeDirty(shape);
  }

  isDocumentDirtyPublic(document: Document): boolean {
    return this.isDocumentDirty(document);
  }

  captureBaselinePublic(document: Document): void {
    this.captureBaseline(document);
  }

  private captureBaseline(document: Document): void {
    this.baseline = collectFingerprints(document);
    this.hasBaseline = true;
  }

  private isShapeDirty(shape: Shape): boolean {
    const id = shape.getId();
    const current = fingerprintShape(shape);
    const saved = this.baseline.get(id);
    if (saved === undefined) {
      return true; // 新建
    }
    return saved !== current;
  }

  private isDocumentDirty(document: Document): boolean {
    const shapes = collectAllShapes(document);
    if (shapes.length !== this.baseline.size) {
      return true;
    }
    for (const shape of shapes) {
      if (this.isShapeDirty(shape)) {
        return true;
      }
    }
    for (const id of this.baseline.keys()) {
      if (!document.getShape(id)) {
        return true;
      }
    }
    return false;
  }
}
