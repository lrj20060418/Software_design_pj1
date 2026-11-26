import type { Document } from "../model/Document.js";

/**
 * 处理器不透明的撤销快照（一次 set 一个单元，可含多子部件状态）。
 */
export type AttributeUndoState = unknown;

/**
 * 内核传给处理器的调用上下文（公开领域能力）。
 * 处理器通过 `document` 查找图形、读类型、调用 `setAttribute` 等公开方法；
 * 不得依赖宿主装配或未公开字段。
 */
export interface AttributeHandlerContext {
  readonly document: Document;
  readonly shapeId: string;
  readonly attr: string;
  readonly value: string;
}

/**
 * 扩展点：某图形上某属性的领域语义。
 *
 * 契约（详见 `doc/adr/0001-attribute-handler-contract.md`）：
 * - `handles` 只读，不改文档
 * - 多处理器同时 `handles===true` → 内核拒绝，不执行任何 apply
 * - 命中唯一处理器 → 先 `captureUndoState`，再 `apply`；一次 set = 一个 undo 单元
 * - `apply` 抛错 → `restoreUndoState`，不入栈，不回落到 Phase 1 默认 set
 */
export interface IAttributeHandler {
  /** 稳定注册名，如 `box-attributes` */
  readonly name: string;

  /** 是否负责该图形及属性；不得修改文档 */
  handles(shapeId: string, attr: string, document: Document): boolean;

  /**
   * 在 `apply` 之前调用，捕获本次可能改动的全部状态，供 undo / 失败回滚。
   * 不得产生对外可观察的副作用（允许只读遍历）。
   */
  captureUndoState(ctx: AttributeHandlerContext): AttributeUndoState;

  /** 执行领域修改；可改动多个子部件；失败须抛错 */
  apply(ctx: AttributeHandlerContext): void;

  /** 用快照完整恢复到 capture 时的状态 */
  restoreUndoState(state: AttributeUndoState): void;
}
