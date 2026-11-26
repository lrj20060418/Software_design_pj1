/**
 * Exp-C0 验收：stats 插件可启用/禁用；DFS 统计；不进 undo。
 */
import { createApp } from "../src/host/createApp.js";
import { collectStats, formatStats } from "../plugins/command-stats/src/collectStats.js";
import { Group } from "../src/model/Group.js";
import { Rect } from "../src/model/Rect.js";
import { Circle } from "../src/model/Circle.js";
import { Text } from "../src/model/Text.js";

const checks: { name: string; ok: boolean; detail?: string }[] = [];
function check(name: string, ok: boolean, detail = ""): void {
  checks.push({ name, ok, detail });
}

// --- 未加载 ---
const off = createApp({ enableOptionalPlugins: false });
check(
  "disabled: unknown command stats",
  off.dispatcher.dispatch("stats") === "error: unknown command: stats",
);
check(
  "disabled: help has no stats",
  !off.dispatcher.dispatch("help").includes("stats"),
);

// --- 已加载 ---
const on = createApp({ enableOptionalPlugins: true });
check(
  "enabled: help lists stats",
  on.dispatcher.dispatch("help").includes("stats"),
);

on.dispatcher.dispatch("init 800 600");
check(
  "empty doc",
  on.dispatcher.dispatch("stats") === "(total 0, containers 0)",
);

on.dispatcher.dispatch("create rect bg 0 0 800 600 #fff");
on.dispatcher.dispatch("create circle c1 10 10 5 red");
on.dispatcher.dispatch("create g node1");
on.dispatcher.dispatch("create rect start 1 2 3 4 blue in node1");
on.dispatcher.dispatch('create text t1 0 0 "hi"');

const statsOut = on.dispatcher.dispatch("stats");
check(
  "stats counts leaves + containers",
  statsOut === "rect: 2  circle: 1  text: 1  (total 4, containers 1)",
  statsOut,
);

const depthBefore = on.history.undoDepth();
on.dispatcher.dispatch("move c1 1 1");
const depthAfterMove = on.history.undoDepth();
on.dispatcher.dispatch("stats");
const depthAfterStats = on.history.undoDepth();
check("stats does not push undo", depthAfterStats === depthAfterMove);
check("move did push undo", depthAfterMove === depthBefore + 1);

const undoOut = on.dispatcher.dispatch("undo");
check("undo after stats still undoes move", undoOut.includes("moved"));

// --- 纯函数：首次出现顺序 + box 容器 ---
const g = new Group("g1");
g.addChild(new Rect("r1", 0, 0, 1, 1));
g.addChild(new Text("t1", 0, 0, "a"));
const roots = [
  new Circle("c1", 0, 0, 1),
  g,
  new Rect("r2", 0, 0, 1, 1),
];
const formatted = formatStats(collectStats(roots));
check(
  "first-seen type order",
  formatted === "circle: 1  rect: 2  text: 1  (total 4, containers 1)",
  formatted,
);

// box 尚无正式类：用子类覆盖 getType 验证容器计数规则
class Boxish extends Group {
  override getType(): string {
    return "box";
  }
}
const boxNode = new Boxish("b1");
boxNode.addChild(new Rect("br", 0, 0, 1, 1));
const withBox = formatStats(collectStats([boxNode]));
check(
  "box counts as container; inner leaf counted",
  withBox === "rect: 1  (total 1, containers 1)",
  withBox,
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
if (failed.length) {
  console.error(`\nExp-C0 FAILED (${failed.length})`);
  process.exit(1);
}
console.log("\nExp-C0 acceptance PASSED.");
