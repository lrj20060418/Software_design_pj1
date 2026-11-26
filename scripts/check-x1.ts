/**
 * 拓展：IDocumentExporter 扩展点 + export-json 插件。
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createApp } from "../src/host/createApp.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

{
  const app = createApp({ enableOptionalPlugins: false });
  check("no exporters by default", app.ctx.exporters.names().length === 0);
  app.dispatcher.dispatch("init 100 100");
  const out = app.dispatcher.dispatch("export json /tmp/x.json");
  check(
    "unknown format without plugin",
    out.includes("unknown export format: json"),
    out,
  );
  check("help lists export", app.dispatcher.dispatch("help").includes("export <format>"));
  check(
    "ext file IDocumentExporter.ts",
    fs.existsSync(path.join("src", "extensions", "IDocumentExporter.ts")),
  );
}

{
  const app = createApp({
    enableOptionalPlugins: false,
    plugins: { exportJson: true },
  });
  check("json registered", app.ctx.exporters.names().includes("json"));
  const d = app.dispatcher;
  d.dispatch("init 200 150");
  d.dispatch("create rect r1 0 0 10 10 red");
  d.dispatch("create g g1");
  d.dispatch("create circle c1 5 5 2 blue in g1");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-export-"));
  const file = path.join(tmp, "out.json");
  try {
    const msg = d.dispatch(`export json ${file}`);
    check("export message", msg === `exported json to ${file}`, msg);
    check("file exists", fs.existsSync(file));
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as {
      width: number;
      height: number;
      roots: { type: string; id: string; children?: unknown[] }[];
    };
    check("json width", parsed.width === 200);
    check("json height", parsed.height === 150);
    check(
      "json roots",
      parsed.roots.some((r) => r.id === "r1" && r.type === "rect") &&
        parsed.roots.some(
          (r) => r.id === "g1" && r.type === "g" && Array.isArray(r.children),
        ),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

{
  const app = createApp({ enableOptionalPlugins: true });
  check(
    "code assembly has json exporter",
    app.ctx.exporters.names().includes("json"),
  );
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(
    `${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
  );
}
if (failed.length) {
  console.error(`\nExp-X1 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-X1 (exporter) acceptance PASSED.");
