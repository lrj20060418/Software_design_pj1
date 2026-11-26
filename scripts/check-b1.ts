/**
 * Exp-B1：box 插件创建 / 属性 / 不变量 / 可禁用。
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createApp } from "../src/host/createApp.js";
import { BoxShapeProvider } from "../plugins/shape-box/src/BoxShapeProvider.js";
import { Box } from "../plugins/shape-box/src/Box.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

// --- 禁用 ---
{
  const off = createApp({ enableOptionalPlugins: false });
  off.dispatcher.dispatch("init 800 600");
  const out = off.dispatcher.dispatch('create box n1 1 2 3 4 "x"');
  check(
    "disabled: unknown shape box",
    out.includes("unknown shape type: box"),
    out,
  );
}

// --- 启用：创建与属性 undo ---
{
  const app = createApp({
    enableOptionalPlugins: false,
    plugins: { box: true },
  });
  const d = app.dispatcher;
  d.dispatch("init 800 600");
  const created = d.dispatch('create box n1 120 100 160 60 "开始"');
  check(
    "create message",
    created.startsWith("box#n1 created (g#n1 + rect#n1-rect + text#n1-label)"),
    created,
  );

  const tree = d.dispatch("tree n1");
  check(
    "tree label is g# without decorator",
    tree.split("\n")[0] === "g#n1",
    tree,
  );

  d.dispatch("set n1 fill #f5a623");
  check(
    "fill on rect",
    app.document.requireShape("n1-rect").getAttribute("fill") === "#f5a623",
  );

  d.dispatch('set n1 label "处理数据 v2"');
  check(
    "label on text",
    app.document.requireShape("n1-label").getAttribute("text") ===
      "处理数据 v2",
  );

  d.dispatch("undo");
  check(
    "undo label",
    app.document.requireShape("n1-label").getAttribute("text") === "开始",
  );
  d.dispatch("redo");
  check(
    "redo label",
    app.document.requireShape("n1-label").getAttribute("text") ===
      "处理数据 v2",
  );

  d.dispatch("undo"); // label
  d.dispatch("undo"); // fill
  check(
    "undo fill",
    app.document.requireShape("n1-rect").getAttribute("fill") === "#4a90d9",
  );

  const move = d.dispatch("move n1 0 100");
  check("move composite", move.includes("box#n1 moved by"), move);

  const ug = d.dispatch("ungroup n1");
  check(
    "ungroup rejected",
    ug.includes("cannot ungroup composite shape: n1"),
    ug,
  );

  const delChild = d.dispatch("delete n1-rect");
  check(
    "delete required child rejected",
    delChild.includes("cannot remove required child"),
    delChild,
  );

  check("box still intact", app.document.getShape("n1") instanceof Box);
}

// --- complete 校验 ---
{
  const provider = new BoxShapeProvider();
  const shell = provider.fromSvg("b1", { "data-kind": "box" }) as Box;
  let threw = false;
  try {
    provider.complete!(shell);
  } catch {
    threw = true;
  }
  check("complete rejects empty shell", threw);
}

// --- 读写 round-trip（装插件）---
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-box-"));
  const file = path.join(tmp, "box.svg");
  try {
    const app = createApp({ plugins: { box: true, stats: false, dir: false } });
    app.dispatcher.dispatch("init 400 200");
    app.dispatcher.dispatch('create box n1 10 10 80 40 "Hi"');
    app.dispatcher.dispatch(`save ${file}`);

    const app2 = createApp({ plugins: { box: true, stats: false, dir: false } });
    const readOut = app2.dispatcher.dispatch(`read ${file}`);
    check("read ok", readOut.includes("read "), readOut);
    check("read restores box", app2.document.getShape("n1") instanceof Box);

    // 未装插件降级
    const app3 = createApp({ enableOptionalPlugins: false });
    const read2 = app3.dispatcher.dispatch(`read ${file}`);
    check("downgrade read ok", read2.includes("read "), read2);
    const shape = app3.document.getShape("n1");
    check(
      "downgrade to g",
      !!shape && shape.getType() === "g" && !(shape instanceof Box),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(
    `${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
  );
}
if (failed.length) {
  console.error(`\nExp-B1 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-B1 acceptance PASSED.");
