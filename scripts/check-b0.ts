/**
 * Exp-B0：AttributeHandler 契约（冲突 / undo 单元 / 失败回滚）+ 无处理器回落。
 */
import { createApp } from "../src/host/createApp.js";
import type {
  AttributeHandlerContext,
  AttributeUndoState,
  IAttributeHandler,
} from "../src/extensions/IAttributeHandler.js";
import type { Document } from "../src/model/Document.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

/** 替身：把「复合」语义做成改两个已有叶子的 fill（模拟多子部件一次 set） */
class TwinFillHandler implements IAttributeHandler {
  readonly name = "twin-fill";

  constructor(
    private readonly primaryId: string,
    private readonly secondaryId: string,
  ) {}

  handles(shapeId: string, attr: string, _doc: Document): boolean {
    return shapeId === this.primaryId && attr === "fill";
  }

  captureUndoState(ctx: AttributeHandlerContext): AttributeUndoState {
    const a = ctx.document.requireShape(this.primaryId).getAttribute("fill");
    const b = ctx.document.requireShape(this.secondaryId).getAttribute("fill");
    return { a, b };
  }

  apply(ctx: AttributeHandlerContext): void {
    ctx.document.requireShape(this.primaryId).setAttribute("fill", ctx.value);
    ctx.document
      .requireShape(this.secondaryId)
      .setAttribute("fill", ctx.value);
  }

  restoreUndoState(state: AttributeUndoState): void {
    const s = state as { a: string | undefined; b: string | undefined };
    // 通过闭包 document：restore 时需要 document — 存在 handler 上
    this.doc.requireShape(this.primaryId).setAttribute("fill", s.a);
    this.doc.requireShape(this.secondaryId).setAttribute("fill", s.b);
  }

  private doc!: Document;
  bind(doc: Document): this {
    this.doc = doc;
    return this;
  }
}

/** 先改 primary，再抛错 */
class FailAfterPartialHandler implements IAttributeHandler {
  readonly name = "fail-partial";
  private doc!: Document;

  constructor(private readonly primaryId: string, private readonly secondaryId: string) {}

  bind(doc: Document): this {
    this.doc = doc;
    return this;
  }

  handles(shapeId: string, attr: string): boolean {
    return shapeId === this.primaryId && attr === "stroke";
  }

  captureUndoState(ctx: AttributeHandlerContext): AttributeUndoState {
    return {
      a: ctx.document.requireShape(this.primaryId).getAttribute("stroke"),
      b: ctx.document.requireShape(this.secondaryId).getAttribute("stroke"),
    };
  }

  apply(ctx: AttributeHandlerContext): void {
    ctx.document.requireShape(this.primaryId).setAttribute("stroke", ctx.value);
    throw new Error("error: simulated handler failure");
  }

  restoreUndoState(state: AttributeUndoState): void {
    const s = state as { a: string | undefined; b: string | undefined };
    this.doc.requireShape(this.primaryId).setAttribute("stroke", s.a);
    this.doc.requireShape(this.secondaryId).setAttribute("stroke", s.b);
  }
}

class AlwaysFillA implements IAttributeHandler {
  readonly name = "always-a";
  handles(shapeId: string, attr: string): boolean {
    return shapeId === "r1" && attr === "fill";
  }
  captureUndoState(): AttributeUndoState {
    return null;
  }
  apply(): void {}
  restoreUndoState(): void {}
}

class AlwaysFillB implements IAttributeHandler {
  readonly name = "always-b";
  handles(shapeId: string, attr: string): boolean {
    return shapeId === "r1" && attr === "fill";
  }
  captureUndoState(): AttributeUndoState {
    return null;
  }
  apply(): void {}
  restoreUndoState(): void {}
}

// --- 无处理器：Phase 1 ---
{
  const app = createApp({ enableOptionalPlugins: false });
  app.dispatcher.dispatch("init 100 100");
  app.dispatcher.dispatch("create rect r1 0 0 10 10 red");
  const ok = app.dispatcher.dispatch("set r1 fill blue");
  check("default set works", ok.includes("fill=blue"));
  const bad = app.dispatcher.dispatch("set r1 label hi");
  check(
    "unknown attribute",
    bad === "error: unknown attribute: label",
    bad,
  );
}

// --- 冲突拒绝 ---
{
  const app = createApp({ enableOptionalPlugins: false });
  app.dispatcher.dispatch("init 100 100");
  app.dispatcher.dispatch("create rect r1 0 0 10 10 red");
  app.ctx.attributes.register(new AlwaysFillA());
  app.ctx.attributes.register(new AlwaysFillB());
  const depth = app.history.undoDepth();
  const out = app.dispatcher.dispatch("set r1 fill green");
  check(
    "conflict rejected",
    out === "error: conflicting attribute handlers for fill on r1",
    out,
  );
  check("conflict no history", app.history.undoDepth() === depth);
  check(
    "conflict no mutation",
    app.document.requireShape("r1").getAttribute("fill") === "red",
  );
}

// --- 多子部件一次 undo ---
{
  const app = createApp({ enableOptionalPlugins: false });
  app.dispatcher.dispatch("init 100 100");
  app.dispatcher.dispatch("create rect r1 0 0 10 10 red");
  app.dispatcher.dispatch("create rect r2 0 0 10 10 blue");
  const twin = new TwinFillHandler("r1", "r2").bind(app.document);
  app.ctx.attributes.register(twin);

  const setOut = app.dispatcher.dispatch("set r1 fill yellow");
  check("twin apply message", setOut.includes("fill=yellow"), setOut);
  check(
    "both updated",
    app.document.requireShape("r1").getAttribute("fill") === "yellow" &&
      app.document.requireShape("r2").getAttribute("fill") === "yellow",
  );

  app.dispatcher.dispatch("undo");
  check(
    "one undo restores both",
    app.document.requireShape("r1").getAttribute("fill") === "red" &&
      app.document.requireShape("r2").getAttribute("fill") === "blue",
  );

  app.dispatcher.dispatch("redo");
  check(
    "one redo reapplies both",
    app.document.requireShape("r1").getAttribute("fill") === "yellow" &&
      app.document.requireShape("r2").getAttribute("fill") === "yellow",
  );
}

// --- 部分失败回滚 ---
{
  const app = createApp({ enableOptionalPlugins: false });
  app.dispatcher.dispatch("init 100 100");
  app.dispatcher.dispatch("create rect r1 0 0 10 10 red");
  app.dispatcher.dispatch("create rect r2 0 0 10 10 blue");
  app.document.requireShape("r1").setAttribute("stroke", "black");
  app.document.requireShape("r2").setAttribute("stroke", "gray");
  // clear history noise from direct setAttribute — use fresh depth after edits via commands
  const depth = app.history.undoDepth();
  const failing = new FailAfterPartialHandler("r1", "r2").bind(app.document);
  app.ctx.attributes.register(failing);

  const out = app.dispatcher.dispatch("set r1 stroke neon");
  check(
    "partial fail returns error",
    out === "error: simulated handler failure",
    out,
  );
  check("partial fail no history push", app.history.undoDepth() === depth);
  check(
    "partial fail rolled back primary",
    app.document.requireShape("r1").getAttribute("stroke") === "black",
  );
  check(
    "secondary untouched",
    app.document.requireShape("r2").getAttribute("stroke") === "gray",
  );
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(
    `${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
  );
}
if (failed.length) {
  console.error(`\nExp-B0 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-B0 acceptance PASSED.");
