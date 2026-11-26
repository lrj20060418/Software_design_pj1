import type {
  AttributeHandlerContext,
  AttributeUndoState,
  IAttributeHandler,
} from "../../../src/extensions/IAttributeHandler.js";
import type { Document } from "../../../src/model/Document.js";
import { Box } from "./Box.js";

interface BoxAttrSnapshot {
  document: Document;
  shapeId: string;
  attr: "fill" | "label";
  previous: string | undefined;
}

/**
 * box 的 fill → 内部 rect；label → 内部 text。
 */
export class BoxAttributeHandler implements IAttributeHandler {
  readonly name = "box-attributes";

  handles(shapeId: string, attr: string, document: Document): boolean {
    if (attr !== "fill" && attr !== "label") {
      return false;
    }
    const shape = document.getShape(shapeId);
    return shape instanceof Box;
  }

  captureUndoState(ctx: AttributeHandlerContext): AttributeUndoState {
    const box = requireBox(ctx.document, ctx.shapeId);
    if (ctx.attr === "fill") {
      return {
        document: ctx.document,
        shapeId: ctx.shapeId,
        attr: "fill",
        previous: box.rect().getAttribute("fill"),
      } satisfies BoxAttrSnapshot;
    }
    return {
      document: ctx.document,
      shapeId: ctx.shapeId,
      attr: "label",
      previous: box.labelNode().getAttribute("text"),
    } satisfies BoxAttrSnapshot;
  }

  apply(ctx: AttributeHandlerContext): void {
    const box = requireBox(ctx.document, ctx.shapeId);
    if (ctx.attr === "fill") {
      box.rect().setAttribute("fill", ctx.value);
      return;
    }
    if (ctx.attr === "label") {
      box.labelNode().setAttribute("text", ctx.value);
      return;
    }
    throw new Error(`error: unknown attribute: ${ctx.attr}`);
  }

  restoreUndoState(state: AttributeUndoState): void {
    const snap = state as BoxAttrSnapshot;
    const box = requireBox(snap.document, snap.shapeId);
    if (snap.attr === "fill") {
      box.rect().setAttribute("fill", snap.previous);
      return;
    }
    box.labelNode().setAttribute("text", snap.previous);
  }
}

function requireBox(document: Document, id: string): Box {
  const shape = document.requireShape(id);
  if (!(shape instanceof Box)) {
    throw new Error(`error: not a box: ${id}`);
  }
  return shape;
}
