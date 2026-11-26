/**
 * 估算圈复杂度（启发式）：1 + 控制流关键字计数。
 * 用法：node scripts/complexity.mjs
 * 对比 git tag `final`（若存在）与工作树当前文件。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
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

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

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

/** McCabe-ish: base 1 + branching tokens */
function estimateComplexity(text) {
  if (!text) return 0;
  // strip strings/comments roughly to reduce noise
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, " ")
    .replace(/'(?:\\.|[^'\\])*'/g, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, " ");
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\b\?\./g, // optional chain not counted as branch
    /\?/g,
    /&&/g,
    /\|\|/g,
  ];
  let extra = 0;
  // count if/for/while/case/catch/ternary/?/&&/||
  // skip ?. by temporarily removing
  const noOpt = stripped.replace(/\?\./g, " .");
  const re =
    /\b(?:if|for|while|case|catch)\b|\?|&&|\|\|/g;
  const matches = noOpt.match(re);
  extra = matches ? matches.length : 0;
  // each function/method adds a base of 1
  const fn =
    noOpt.match(
      /\bfunction\b|\b=>\b|\bget\s+[A-Za-z_]|\bset\s+[A-Za-z_]/g,
    ) ?? [];
  const bases = Math.max(fn.length, 1);
  return bases + extra;
}

function gitShow(tag, fileRel) {
  try {
    return execSync(`git show ${tag}:${fileRel}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function tagExists(tag) {
  try {
    execSync(`git rev-parse --verify ${tag}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const files = [...walk(path.join(root, "src")), ...walk(path.join(root, "plugins"))];
const hasFinal = tagExists("final");

const byBucket = {
  kernel: { current: 0, final: 0 },
  assembly: { current: 0, final: 0 },
  plugins: { current: 0, final: 0 },
  other: { current: 0, final: 0 },
};

const fileRows = [];

for (const file of files) {
  const r = rel(file);
  const bucket = classify(r);
  const currentText = fs.readFileSync(file, "utf8");
  const current = estimateComplexity(currentText);
  let finalCx = 0;
  if (hasFinal) {
    const old = gitShow("final", r);
    if (old !== null) {
      finalCx = estimateComplexity(old);
    }
  }
  byBucket[bucket].current += current;
  byBucket[bucket].final += finalCx;
  fileRows.push({
    file: r,
    bucket,
    complexity: current,
    finalComplexity: finalCx,
    delta: current - finalCx,
  });
}

fileRows.sort((a, b) => a.file.localeCompare(b.file));

const summary = {
  generatedAt: new Date().toISOString(),
  method:
    "heuristic McCabe-like: (#functions) + count(if|for|while|case|catch|?|&&|||); strings/comments stripped",
  baselineTag: hasFinal ? "final" : null,
  note: hasFinal
    ? "delta = current working tree − tag final (missing files at final count as 0)"
    : "tag final not found; finalComplexity columns are 0",
  totals: Object.fromEntries(
    Object.entries(byBucket).map(([k, v]) => [
      k,
      { current: v.current, final: v.final, delta: v.current - v.final },
    ]),
  ),
  files: fileRows,
};

const outDir = path.join(root, "docs", "metrics");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "complexity.json"),
  JSON.stringify(summary, null, 2) + "\n",
);

console.log("complexity written to docs/metrics/complexity.json");
console.log(summary.totals);
