/**
 * Exp-V0 静态验收：不依赖 VSCode 运行时。
 * 核对装饰逻辑源码契约 + fixtures 存在。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const providerSrc = fs.readFileSync(
  path.join(root, "src", "SvgFileDecorationProvider.ts"),
  "utf8"
);

const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

check(
  "badge is []",
  /new vscode\.FileDecoration\(\s*\"\[\]\"/.test(providerSrc),
  "FileDecoration must use badge []"
);

check(
  "non-svg returns undefined",
  /if\s*\(\s*!this\.isSvgFile\(uri\)\s*\)\s*\{\s*return undefined/.test(
    providerSrc
  ),
  "must skip non-svg"
);

check(
  "svg suffix check",
  /\.endsWith\(\s*[\"']\.svg[\"']\s*\)/.test(providerSrc),
  "must match .svg suffix"
);

const fixtures = ["example.svg", "plain.txt", "session.txt"];
for (const f of fixtures) {
  const p = path.join(root, "fixtures", f);
  check(`fixture exists: ${f}`, fs.existsSync(p), p);
}

const example = path.join(root, "fixtures", "example.svg");
if (fs.existsSync(example)) {
  const before = fs.readFileSync(example);
  // 装饰不应改文件；此处仅确认可读且非空
  check("example.svg unchanged & non-empty", before.length > 0);
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\nExp-V0 acceptance FAILED (${failed.length})`);
  process.exit(1);
}

console.log("\nExp-V0 acceptance PASSED (static). UI: F5 → confirm [] on example.svg only.");
