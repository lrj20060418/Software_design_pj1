/**
 * 按「内核 / 装配处 / 插件」统计 TypeScript 行数（脚本生成，禁手填）。
 * 用法：node scripts/metrics.mjs
 */
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
  note: "LOC by bucket for Phase 2 Exp-F0 scaffold; complexity delta vs final filled at p2 tag.",
  totals,
  files: inventory,
};

fs.writeFileSync(
  path.join(outDir, "loc.json"),
  JSON.stringify(summary, null, 2) + "\n",
);

const md = [
  "# Metrics (auto-generated)",
  "",
  `Generated: ${generatedAt}`,
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
  "_Pending: compare `final` → `p2` with dedicated complexity script at Exp-D0._",
  "",
];

fs.writeFileSync(path.join(outDir, "README.md"), md.join("\n"));
console.log(`metrics written to docs/metrics/ (${inventory.length} files)`);
console.log(totals);
