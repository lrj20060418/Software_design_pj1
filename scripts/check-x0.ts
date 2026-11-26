/**
 * 拓展：diamond 形状插件 — 创建 / 移动 / IO / 可禁用 / 不改既有内核契约。
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createApp } from "../src/host/createApp.js";
import { Diamond } from "../plugins/shape-diamond/src/Diamond.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

{
  const off = createApp({ enableOptionalPlugins: false });
  off.dispatcher.dispatch("init 400 300");
  const out = off.dispatcher.dispatch("create diamond d1 100 100 80 60");
  check(
    "disabled: unknown shape diamond",
    out.includes("unknown shape type: diamond"),
    out,
  );
}

{
  const app = createApp({
    enableOptionalPlugins: false,
    plugins: { diamond: true },
    diamond: { fill: "#f5a623" },
  });
  const d = app.dispatcher;
  d.dispatch("init 400 300");
  const created = d.dispatch("create diamond d1 200 150 100 80");
  check(
    "create message",
    created === "diamond#d1 created",
    created,
  );

  const shape = app.document.requireShape("d1");
  check("instance", shape instanceof Diamond || shape.getType() === "diamond");
  check("default fill", shape.getAttribute("fill") === "#f5a623");

  const tree = d.dispatch("tree d1");
  check(
    "tree line",
    tree.includes("diamond#d1") && tree.includes("cx=200"),
    tree,
  );

  d.dispatch("set d1 fill red");
  check("set fill", shape.getAttribute("fill") === "red");

  const moved = d.dispatch("move d1 10 20");
  check("move", moved.includes("diamond#d1 moved"), moved);
  check("moved cx", shape.getAttribute("cx") === "210");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-diamond-"));
  const file = path.join(tmp, "d.svg");
  try {
    d.dispatch(`save ${file}`);
    const xml = fs.readFileSync(file, "utf8");
    check(
      "svg has polygon data-kind",
      xml.includes('data-kind="diamond"') && xml.includes("<polygon"),
      xml.slice(0, 400),
    );

    const app2 = createApp({
      enableOptionalPlugins: false,
      plugins: { diamond: true },
    });
    const read = app2.dispatcher.dispatch(`read ${file}`);
    check("read ok", read.startsWith("read "), read);
    const restored = app2.document.requireShape("d1");
    check(
      "read restores diamond",
      restored.getType() === "diamond" &&
        restored.getAttribute("cx") === "210" &&
        restored.getAttribute("fill") === "red",
      `${restored.getType()} cx=${restored.getAttribute("cx")} fill=${restored.getAttribute("fill")}`,
    );

    // 未装插件：polygon 被忽略，读入不崩溃
    const bare = createApp({ enableOptionalPlugins: false });
    bare.dispatcher.dispatch("init 1 1");
    const bareRead = bare.dispatcher.dispatch(`read ${file}`);
    check("downgrade read ok", bareRead.startsWith("read "), bareRead);
    check("downgrade dropped", bare.document.getShape("d1") == null);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

{
  // 方式 A 默认装载含 diamond
  const app = createApp({ enableOptionalPlugins: true });
  check("code assembly has diamond", app.ctx.shapes.has("diamond"));
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(
    `${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
  );
}
if (failed.length) {
  console.error(`\nExp-X0 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-X0 (diamond) acceptance PASSED.");
