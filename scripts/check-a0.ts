/**
 * Exp-A0：双装配一致性 + 加载器失败路径与回滚。
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createApp, loadConfigPlugins } from "../src/host/createApp.js";
import { activatePluginValidated } from "../src/host/activatePlugin.js";
import { loadPluginsFromConfig } from "../src/host/PluginLoader.js";
import type { PluginContext } from "../src/extensions/PluginContext.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

function runSession(
  dispatch: (line: string) => string,
  lines: string[],
): string {
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const o = dispatch(t);
    if (o) out.push(o);
  }
  return out.join("\n");
}

const session = [
  "init 800 600",
  'create box n1 120 100 160 60 "开始"',
  "stats",
  "tree n1",
];

async function main(): Promise<void> {
  // --- 方式 A vs B 输出一致 ---
  {
    const logs: string[] = [];
    const appA = createApp({
      assembly: "code",
      enableOptionalPlugins: true,
      pluginLog: (m) => logs.push(m),
    });
    const outA = runSession((l) => appA.dispatcher.dispatch(l), session);

    const appB = createApp({
      assembly: "config",
      pluginLog: (m) => logs.push(m),
    });
    await loadConfigPlugins(appB, {
      configPath: path.resolve("plugins.config.json"),
      pluginLog: (m) => logs.push(m),
    });
    const outB = runSession((l) => appB.dispatcher.dispatch(l), session);

    check(
      "A/B session output identical",
      outA === outB,
      `A:\n${outA}\n---\nB:\n${outB}`,
    );
    check("box loaded in A", appA.ctx.shapes.has("box"));
    check("box loaded in B", appB.ctx.shapes.has("box"));
    check("stats in A", appA.ctx.commands.names().includes("stats"));
    check("stats in B", appB.ctx.commands.names().includes("stats"));
  }

  // --- 非法配置 ---
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-cfg-"));
    const bad = path.join(tmp, "bad.json");
    fs.writeFileSync(bad, "{ not json");
    const logs: string[] = [];
    const app = createApp({ assembly: "config", pluginLog: (m) => logs.push(m) });
    await loadPluginsFromConfig(app.ctx, bad, (m) => logs.push(m));
    check(
      "invalid config",
      logs.some((l) => l === "error: invalid plugin config"),
      logs.join("|"),
    );
    check("builtins still work", app.dispatcher.dispatch("help").includes("create"));
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // --- 模块找不到 ---
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-cfg-"));
    const cfg = path.join(tmp, "plugins.config.json");
    fs.writeFileSync(
      cfg,
      JSON.stringify({ plugins: [{ module: "./no-such-plugin-xyz" }] }),
    );
    const logs: string[] = [];
    const app = createApp({ assembly: "config" });
    await loadPluginsFromConfig(app.ctx, cfg, (m) => logs.push(m));
    check(
      "plugin not found",
      logs.some((l) => l.startsWith("error: plugin not found:")),
      logs.join("|"),
    );
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // --- 无默认导出 ---
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-cfg-"));
    const pluginDir = path.join(tmp, "empty-plugin");
    fs.mkdirSync(path.join(pluginDir, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(pluginDir, "package.json"),
      JSON.stringify({ name: "empty-plugin", contributes: { commands: ["x"] } }),
    );
    fs.writeFileSync(path.join(pluginDir, "src", "index.ts"), "export const foo = 1;\n");
    const cfg = path.join(tmp, "plugins.config.json");
    fs.writeFileSync(
      cfg,
      JSON.stringify({ plugins: [{ module: "./empty-plugin" }] }),
    );
    const logs: string[] = [];
    const app = createApp({ assembly: "config" });
    await loadPluginsFromConfig(app.ctx, cfg, (m) => logs.push(m));
    check(
      "no default export",
      logs.some((l) => l.startsWith("error: plugin has no default export:")),
      logs.join("|"),
    );
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // --- manifest mismatch 回滚 ---
  {
    const app = createApp({ assembly: "config" });
    const beforeShapes = app.ctx.shapes.types().slice();
    const err = activatePluginValidated(app.ctx, {
      name: "bad-manifest",
      contributes: { shapes: ["ghost"], commands: [], decorators: [], attributes: [] },
      activate: (ctx: PluginContext) => {
        ctx.commands.register({
          name: "ghost-cmd",
          helpLines: () => [],
          execute: () => "",
        });
      },
    });
    check(
      "manifest mismatch",
      !!err && err.startsWith("error: plugin manifest mismatch:"),
      err ?? "",
    );
    check(
      "mismatch rolled back",
      !app.ctx.commands.names().includes("ghost-cmd") &&
        app.ctx.shapes.types().join() === beforeShapes.join(),
    );
  }

  // --- activate 抛错回滚 ---
  {
    const app = createApp({ assembly: "config" });
    const err = activatePluginValidated(app.ctx, {
      name: "boom",
      contributes: { shapes: [], commands: ["boom"], decorators: [], attributes: [] },
      activate: (ctx) => {
        ctx.commands.register({
          name: "boom",
          helpLines: () => [],
          execute: () => "",
        });
        throw new Error("explode");
      },
    });
    check(
      "activate failure",
      !!err && err.startsWith("error: plugin failed to activate: boom"),
      err ?? "",
    );
    check("activate rollback", !app.ctx.commands.names().includes("boom"));
  }

  // --- 重复注册回滚 ---
  {
    const app = createApp({
      assembly: "code",
      plugins: { stats: true, dir: false, box: false, treeStar: false, treeBoxLabel: false },
    });
    const err = activatePluginValidated(app.ctx, {
      name: "dup-stats",
      contributes: { shapes: [], commands: ["stats"], decorators: [], attributes: [] },
      activate: (ctx) => {
        ctx.commands.register({
          name: "stats",
          helpLines: () => [],
          execute: () => "dup",
        });
      },
    });
    check(
      "duplicate registration",
      !!err && err.includes("duplicate registration"),
      err ?? "",
    );
  }

  // --- enabled: false 跳过 ---
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-cfg-"));
    const cfg = path.join(tmp, "plugins.config.json");
    fs.writeFileSync(
      cfg,
      JSON.stringify({
        plugins: [
          {
            module: path.resolve("plugins/command-stats").replace(/\\/g, "/"),
            enabled: false,
          },
        ],
      }),
    );
    const app = createApp({ assembly: "config" });
    await loadPluginsFromConfig(app.ctx, cfg, () => {});
    check("enabled false skips", !app.ctx.commands.names().includes("stats"));
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) {
    console.log(
      `${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
    );
  }
  if (failed.length) {
    console.error(`\nExp-A0 FAILED (${failed.length})`);
    process.exit(1);
  }
  console.log("\nExp-A0 acceptance PASSED.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
