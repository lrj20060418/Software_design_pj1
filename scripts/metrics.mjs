/**
 * 按「内核 / 装配处 / 插件」统计 TypeScript 行数，并嵌入圈复杂度增量（脚本生成，禁手填）。
 * 用法：node scripts/metrics.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const pluginsRoot = path.join(root, "plugins");

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(full, files);
    } else if (entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

function countLines(file) {
  const text = fs.readFileSync(file, "utf8");
  if (text.length === 0) {
    return 0;
  }
  return text.split(/\r?\n/).length;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

const outDir = path.join(root, "docs", "metrics");
fs.mkdirSync(outDir, { recursive: true });

const inventory = [];
const totals = { kernel: 0, assembly: 0, plugins: 0, other: 0 };

function classify(fileRel) {
  if (fileRel.startsWith("plugins/")) return "plugins";
  if (!fileRel.startsWith("src/")) return "other";
  const top = fileRel.split("/")[1];
  if (["extensions", "model", "history", "commands", "io"].includes(top)) {
    return "kernel";
  }
  if (["host", "cli", "builtin"].includes(top)) {
    return "assembly";
  }
  return "other";
}

for (const file of [...walk(src), ...walk(pluginsRoot)]) {
  const r = rel(file);
  const bucket = classify(r);
  const lines = countLines(file);
  totals[bucket] += lines;
  inventory.push({ file: r, bucket, lines });
}

inventory.sort((a, b) => a.file.localeCompare(b.file));

const generatedAt = new Date().toISOString();
const summary = {
  generatedAt,
  note: "LOC by bucket (kernel / assembly / plugins). Complexity via scripts/complexity.mjs.",
  totals,
  files: inventory,
};

fs.writeFileSync(
  path.join(outDir, "loc.json"),
  JSON.stringify(summary, null, 2) + "\n",
);

execSync("node scripts/complexity.mjs", { stdio: "inherit", cwd: root });
const complexity = JSON.parse(
  fs.readFileSync(path.join(outDir, "complexity.json"), "utf8"),
);

const cxTotals = complexity.totals ?? {};
const cxRows = ["kernel", "assembly", "plugins", "other"].map((k) => {
  const t = cxTotals[k] ?? { current: 0, final: 0, delta: 0 };
  return `| ${k} | ${t.final} | ${t.current} | ${t.delta >= 0 ? "+" : ""}${t.delta} |`;
});

const md = [
  "# Metrics (auto-generated)",
  "",
  `Generated: ${generatedAt}`,
  "",
  "> CLI 范围；VSCode 扩展不计入。数字由 `node scripts/metrics.mjs` / `complexity.mjs` 从源码与 git 生成。",
  "",
  "## Lines of code by bucket",
  "",
  "| Bucket | Lines |",
  "|---|---|",
  `| kernel | ${totals.kernel} |`,
  `| assembly | ${totals.assembly} |`,
  `| plugins | ${totals.plugins} |`,
  `| other | ${totals.other} |`,
  `| **sum** | **${Object.values(totals).reduce((a, b) => a + b, 0)}** |`,
  "",
  "## File inventory",
  "",
  "| File | Bucket | Lines |",
  "|---|---|---|",
  ...inventory.map((f) => `| \`${f.file}\` | ${f.bucket} | ${f.lines} |`),
  "",
  "## Cyclomatic complexity delta",
  "",
  complexity.baselineTag
    ? `Baseline tag: \`${complexity.baselineTag}\` → current working tree.`
    : "_tag `final` not found; final column is 0._",
  "",
  `Method: ${complexity.method}`,
  "",
  "| Bucket | final | current | Δ |",
  "|---|---|---|---|",
  ...cxRows,
  "",
  "Per-file detail: [`complexity.json`](./complexity.json).",
  "",
];

fs.writeFileSync(path.join(outDir, "README.md"), md.join("\n"));
console.log(`metrics written to docs/metrics/ (${inventory.length} files)`);
console.log(totals);
