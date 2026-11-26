/**
 * Exp-V2 文档验收：A.3 三节 + 截图 + fixtures + 扩展可编译。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

execSync("pnpm run compile", { cwd: root, stdio: "inherit" });
check("extension compiles", true);

const a3 = path.join(root, "docs", "A3_ANALYSIS.md");
check("A3_ANALYSIS.md exists", fs.existsSync(a3));
const text = fs.existsSync(a3) ? fs.readFileSync(a3, "utf8") : "";

check(
  "A.3: VSCode vs plugin responsibilities",
  /职责划分/.test(text) && /registerFileDecorationProvider/.test(text)
);
check(
  "A.3: Decorator / Adaptor analysis",
  /经典 GoF Decorator/.test(text) && /Adaptor/.test(text)
);
check(
  "A.3: Phase 1 reuse assessment",
  /Phase 1 代码复用评估/.test(text) && /SvgReader/.test(text)
);

for (const img of ["svg-badge.jpg", "svg-outline.jpg"]) {
  const p = path.join(root, "docs", "images", img);
  check(`screenshot: ${img}`, fs.existsSync(p) && fs.statSync(p).size > 1000);
}

for (const f of ["example.svg", "broken.svg", "plain.txt"]) {
  check(
    `fixture: ${f}`,
    fs.existsSync(path.join(root, "fixtures", f))
  );
}

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
check("README links A3", /A3_ANALYSIS\.md/.test(readme));
check("README has install steps", /pnpm run compile/.test(readme));

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
if (failed.length) {
  console.error(`\nExp-V2 acceptance FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-V2 acceptance PASSED.");
