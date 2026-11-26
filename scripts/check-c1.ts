/**
 * Exp-C1 验收：dir 插件、适配器替身、真实 FS、不改文档/历史。
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createApp } from "../src/host/createApp.js";
import { FakeDirectoryAccess } from "../plugins/command-dir/src/FakeDirectoryAccess.js";
import { formatDirListing } from "../plugins/command-dir/src/formatDirListing.js";
import { NodeFsDirectoryAccess } from "../plugins/command-dir/src/NodeFsDirectoryAccess.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

// --- 禁用 ---
const off = createApp({ enableOptionalPlugins: false });
check(
  "disabled: unknown command dir",
  off.dispatcher.dispatch("dir") === "error: unknown command: dir",
);

// --- 未 init 即可用（仅开 dir）---
const fake = new FakeDirectoryAccess();
const cwdKey = "/tmp/fake-cwd";
fake.seed(cwdKey, [
  { name: "zebra.txt", kind: "file" },
  { name: "docs", kind: "dir" },
  { name: ".hidden", kind: "file" },
  { name: "plugins", kind: "dir" },
  { name: "alpha.md", kind: "file" },
]);

const onlyDir = createApp({
  enableOptionalPlugins: false,
  plugins: { dir: true },
  dir: { cwd: cwdKey, directoryAccess: fake },
});
check("no init required", !onlyDir.document.isReady());
const listed = onlyDir.dispatcher.dispatch("dir");
const expected = [
  "[DIR]  docs",
  "[DIR]  plugins",
  "[FILE] .hidden",
  "[FILE] alpha.md",
  "[FILE] zebra.txt",
].join("\n");
check("stable sort mixed", listed === expected, listed);

// --- 空目录 ---
fake.seed("/empty", []);
const emptyApp = createApp({
  plugins: { stats: false, dir: true },
  dir: { cwd: "/empty", directoryAccess: fake },
});
check(
  "empty directory",
  emptyApp.dispatcher.dispatch("dir") === "(empty directory)",
);

// --- 读取失败 ---
fake.fail("/nope");
const failApp = createApp({
  plugins: { stats: false, dir: true },
  dir: { cwd: "/nope", directoryAccess: fake },
});
check(
  "read failure message",
  failApp.dispatcher.dispatch("dir") === "error: cannot read directory: /nope",
);

// --- 不改文档与 undo ---
const histApp = createApp({
  plugins: { stats: false, dir: true },
  dir: { cwd: cwdKey, directoryAccess: fake },
});
histApp.dispatcher.dispatch("init 100 100");
histApp.dispatcher.dispatch("create rect r1 0 0 1 1");
const depth = histApp.history.undoDepth();
const treeBefore = histApp.dispatcher.dispatch("tree");
histApp.dispatcher.dispatch("dir");
check("undo depth unchanged", histApp.history.undoDepth() === depth);
check(
  "tree unchanged after dir",
  histApp.dispatcher.dispatch("tree") === treeBefore,
);

// 失败也不改历史
const failHist = createApp({
  plugins: { stats: false, dir: true },
  dir: { cwd: "/nope", directoryAccess: fake },
});
failHist.dispatcher.dispatch("init 1 1");
failHist.dispatcher.dispatch("create circle c1 0 0 1");
const d2 = failHist.history.undoDepth();
failHist.dispatcher.dispatch("dir");
check("fail dir keeps history", failHist.history.undoDepth() === d2);

// --- format 纯函数稳定排序 ---
check(
  "formatDirListing sort",
  formatDirListing([
    { name: "b", kind: "file" },
    { name: "a", kind: "dir" },
    { name: "c", kind: "dir" },
  ]) === "[DIR]  a\n[DIR]  c\n[FILE] b",
);

// --- 真实文件系统临时目录 ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "svg-dir-"));
try {
  fs.mkdirSync(path.join(tmp, "docs"));
  fs.mkdirSync(path.join(tmp, "plugins"));
  fs.writeFileSync(path.join(tmp, "demo.svg"), "<svg/>");
  fs.writeFileSync(path.join(tmp, "package.json"), "{}");
  fs.writeFileSync(path.join(tmp, ".gitignore"), "");

  const real = createApp({
    plugins: { stats: false, dir: true },
    dir: { cwd: tmp, directoryAccess: new NodeFsDirectoryAccess() },
  });
  const out = real.dispatcher.dispatch("dir");
  const want = [
    "[DIR]  docs",
    "[DIR]  plugins",
    "[FILE] .gitignore",
    "[FILE] demo.svg",
    "[FILE] package.json",
  ].join("\n");
  check("real fs adapter", out === want, out);

  // 适配器与命令组合：同一 NodeFs 再直接 list 应对齐
  const raw = formatDirListing(new NodeFsDirectoryAccess().list(tmp));
  check("command matches adapter format", out === raw);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

check(
  "help lists dir when enabled",
  onlyDir.dispatcher.dispatch("help").includes("dir"),
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(
    `${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
  );
}
if (failed.length) {
  console.error(`\nExp-C1 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-C1 acceptance PASSED.");
