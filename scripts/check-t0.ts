/**
 * Exp-T0：modified-star 状态机 + (box) 共存；无装饰器时 tree 基线不变。
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createApp } from "../src/host/createApp.js";
import { ModifiedStarDecorator } from "../plugins/tree-star/src/ModifiedStarDecorator.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

// --- 无装饰器：基线 ---
{
  const app = createApp({ enableOptionalPlugins: false });
  app.dispatcher.dispatch("init 800 600");
  app.dispatcher.dispatch("create rect r1 0 0 10 10 red");
  const tree = app.dispatcher.dispatch("tree");
  check(
    "baseline no star/box",
    tree === "svg (800x600)\n└── rect#r1  x=0 y=0 w=10 h=10 fill=red",
    tree,
  );
}

// --- modified-star 状态机：编辑 → 保存 → 再编辑 → undo 回保存点 ---
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-star-"));
  const file = path.join(tmp, "a.svg");
  try {
    const app = createApp({
      enableOptionalPlugins: false,
      plugins: { treeStar: true },
    });
    const d = app.dispatcher;
    d.dispatch("init 100 100");
    d.dispatch("create rect r1 0 0 10 10 red");
    // init 已 capture 空文档基线；create 后应 dirty
    let tree = d.dispatch("tree");
    check("new node dirty", tree.includes("rect#r1") && tree.includes(" *"), tree);
    check("root dirty after create", tree.startsWith("svg (100x100) *"), tree);

    d.dispatch(`save ${file}`);
    tree = d.dispatch("tree");
    check(
      "clean after save",
      tree === "svg (100x100)\n└── rect#r1  x=0 y=0 w=10 h=10 fill=red",
      tree,
    );

    d.dispatch("set r1 fill blue");
    tree = d.dispatch("tree");
    check("dirty after edit", tree.includes("fill=blue *"), tree);

    d.dispatch("undo");
    tree = d.dispatch("tree");
    check(
      "undo to save point clears star",
      tree === "svg (100x100)\n└── rect#r1  x=0 y=0 w=10 h=10 fill=red",
      tree,
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// --- 独立状态机（不经过 REPL）---
{
  const app = createApp({ enableOptionalPlugins: false });
  app.dispatcher.dispatch("init 50 50");
  app.dispatcher.dispatch("create circle c1 1 1 2 red");
  const star = new ModifiedStarDecorator();
  star.captureBaselinePublic(app.document);
  check(
    "unit: clean after capture",
    !star.isShapeDirtyPublic(app.document.requireShape("c1")),
  );
  app.dispatcher.dispatch("set c1 fill blue");
  check(
    "unit: dirty after set",
    star.isShapeDirtyPublic(app.document.requireShape("c1")),
  );
  app.dispatcher.dispatch("undo");
  check(
    "unit: clean after undo",
    !star.isShapeDirtyPublic(app.document.requireShape("c1")),
  );
}

// --- 两标签共存 ---
{
  const app = createApp({
    enableOptionalPlugins: false,
    plugins: { box: true, treeBoxLabel: true, treeStar: true },
  });
  const d = app.dispatcher;
  d.dispatch("init 800 600");
  d.dispatch('create box n1 120 100 160 60 "开始"');
  const tree = d.dispatch("tree");
  check("box label present", tree.includes("g#n1 (box)"), tree);
  check("star on new box line", /g#n1 \(box\) \*/.test(tree), tree);
  check(
    "star does not strip box label",
    tree.includes("(box)") && tree.includes(" *"),
    tree,
  );
}

// --- 仅 box-label、无 star ---
{
  const app = createApp({
    enableOptionalPlugins: false,
    plugins: { box: true, treeBoxLabel: true },
  });
  app.dispatcher.dispatch("init 800 600");
  app.dispatcher.dispatch('create box n1 1 2 3 4 "x"');
  const tree = app.dispatcher.dispatch("tree n1");
  check(
    "box label without star",
    tree.startsWith("g#n1 (box)") && !tree.includes(" *"),
    tree,
  );
}

// --- 祖先不传播 ---
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-star2-"));
  const file = path.join(tmp, "b.svg");
  try {
    const app = createApp({
      enableOptionalPlugins: false,
      plugins: { treeStar: true },
    });
    const d = app.dispatcher;
    d.dispatch("init 100 100");
    d.dispatch("create g g1");
    d.dispatch("create rect r1 0 0 1 1 red in g1");
    d.dispatch(`save ${file}`);
    d.dispatch("set r1 fill blue");
    const tree = d.dispatch("tree");
    const lines = tree.split("\n");
    const gLine = lines.find((l) => l.includes("g#g1"));
    const rLine = lines.find((l) => l.includes("rect#r1"));
    check("child has star", !!rLine && rLine.includes(" *"), rLine);
    check("parent no star", !!gLine && !gLine.includes(" *"), gLine);
    check("root has star", lines[0].endsWith(" *"), lines[0]);
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
  console.error(`\nExp-T0 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-T0 acceptance PASSED.");
