/**
 * Exp-F0 验收：扩展点就位 + 内置装配 + smoke 会话关键断言。
 */
import { createApp } from "../src/host/createApp.js";
import fs from "node:fs";
import path from "node:path";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

const app = createApp({ enableOptionalPlugins: false });
const { ctx, dispatcher } = app;

check("shape providers = 6", ctx.shapes.types().sort().join(",") === "circle,ellipse,g,line,rect,text");
check("builtin commands registered", ctx.commands.names().includes("create") && ctx.commands.names().includes("help"));
check("no tree decorators by default", ctx.treeDecorators.list().length === 0);
check("no attribute handlers by default", ctx.attributes.list().length === 0);

const help = dispatcher.dispatch("help");
check("help lists create", help.includes("create <type>"));
check("help lists help", /help\s+show this help/.test(help));

function run(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const o = dispatcher.dispatch(t);
    if (o) out.push(o);
  }
  return out;
}

const app2 = createApp({ enableOptionalPlugins: false });
const d = app2.dispatcher;
const outputs = run([
  "init 800 600",
  'create rect bg 0 0 800 600 #ffffff',
  'create text title 20 40 "My Diagram"',
  "create circle c1 100 100 20 red",
  "create g node1",
  "create rect start 120 100 160 60 #4a90d9 in node1",
  "tree",
  "show c1",
  "move c1 5 5",
  "set c1 fill green",
  "undo",
  "create box n1 1 2 3 4 x",
]);

check("init ok", outputs[0] === "canvas 800x600 created");
check("tree has svg root", outputs.some((o) => o.startsWith("svg (800x600)")));
check("tree has rect#bg", outputs.some((o) => o.includes("rect#bg")));
check("unknown shape box", outputs.some((o) => o.includes("error: unknown shape type: box")));
check(
  "tree no decorator suffix",
  outputs.some((o) => o.split("\n")[0] === "svg (800x600)"),
);

// 扩展点接口文件存在
const extDir = path.join("src", "extensions");
for (const f of [
  "IShapeProvider.ts",
  "ICliCommand.ts",
  "ITreeDecorator.ts",
  "IAttributeHandler.ts",
  "IDocumentExporter.ts",
  "PluginContext.ts",
]) {
  check(`ext file ${f}`, fs.existsSync(path.join(extDir, f)));
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
if (failed.length) {
  console.error(`\nExp-F0 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-F0 acceptance PASSED.");
