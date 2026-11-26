/**
 * Exp-V1 静态验收：解析器嵌套 / 无 id / 残缺 XML 不崩溃。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
execSync("pnpm run compile", { cwd: root, stdio: "inherit" });

const require = createRequire(import.meta.url);
const { parseSvgOutline } = require("../out/SvgOutlineParser.js");

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function names(nodes) {
  return nodes.map((n) => ({
    name: n.name,
    children: names(n.children),
  }));
}

// 1) 嵌套分组（fixtures/example.svg）
const example = fs.readFileSync(path.join(root, "fixtures", "example.svg"), "utf8");
const tree = parseSvgOutline(example);
check("root is svg", tree.length === 1 && tree[0].name === "svg");
check(
  "nested g#flow → rect#start + g#nested → text",
  tree[0]?.children?.[0]?.name === "g#flow" &&
    tree[0].children[0].children[0]?.name === "rect#start" &&
    tree[0].children[0].children[1]?.name === "g#nested" &&
    tree[0].children[0].children[1].children[0]?.name === "text",
  JSON.stringify(names(tree), null, 2)
);

// 2) 无 id 元素显示为标签名
check(
  "text without id shows as text",
  tree[0]?.children?.[0]?.children?.[1]?.children?.[0]?.name === "text"
);

// 3) 残缺 XML 不抛错
const broken = fs.readFileSync(path.join(root, "fixtures", "broken.svg"), "utf8");
let brokenResult;
let threw = false;
try {
  brokenResult = parseSvgOutline(broken);
} catch (e) {
  threw = true;
  brokenResult = e;
}
check("broken svg does not throw", !threw, String(brokenResult));
check(
  "broken svg returns array",
  Array.isArray(brokenResult),
  typeof brokenResult
);

// 4) 编辑更新：改文本后结构变化（模拟）
const edited = example.replace(
  '<text x="30" y="50">Hello &amp; SVG</text>',
  '<circle id="c1" cx="10" cy="10" r="5"/>'
);
const editedTree = parseSvgOutline(edited);
check(
  "edit updates outline (text → circle#c1)",
  editedTree[0]?.children?.[0]?.children?.[1]?.children?.[0]?.name ===
    "circle#c1"
);

// 5) Provider 源码已注册
const ext = fs.readFileSync(path.join(root, "src", "extension.ts"), "utf8");
check(
  "registers DocumentSymbolProvider",
  /registerDocumentSymbolProvider/.test(ext)
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(
    `${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? `\n       ${c.detail}` : ""}`
  );
}
if (failed.length) {
  console.error(`\nExp-V1 acceptance FAILED (${failed.length})`);
  process.exit(1);
}
console.log(
  "\nExp-V1 acceptance PASSED (static). UI: F5 → Outline shows tree; click jumps; edit refreshes."
);
