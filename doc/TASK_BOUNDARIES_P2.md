# 分步实验任务边界 — Phase 2（Experiment Plan）

> 依据 [`pj1-phase2/phase_cli_2.md`](../pj1-phase2/phase_cli_2.md)。  
> **前置**：Phase 1 已完成（tag `final`）；本阶段**不修改** Phase 1 已定义命令的行为。  
> AI 与人类开发均以 **当前唯一激活的 Exp** 为准；完成并 commit 后再激活下一个。  
> 最终在同一远程仓库打 tag **`p2`**（已打的 tag 不得移动）。

**状态图例**：`[x]` 已完成 · `[ ]` 未做 · `[~]` 进行中

---

## 总览

| Exp | 主题 | 状态 | 对应规格 |
|---|---|---|---|
| Exp-V0 | VSCode 扩展：SVG 文件标记 `[]` | `[x]` | A.1 |
| Exp-V1 | VSCode 扩展：SVG 大纲 + 定位/更新 | `[x]` | A.2 |
| Exp-V2 | VSCode 分析文档 + 截图/示例提交 | `[x]` | A.3 |
| Exp-F0 | CLI：四个扩展点就位 + Phase 1 回归 | `[x]` | §1；§7 过程「框架可扩展」 |
| Exp-C0 | 命令插件：`stats` | `[x]` | §2.1 |
| Exp-C1 | 命令插件：`dir` + 文件系统适配器 | `[x]` | §2.2–2.3 |
| Exp-B0 | 属性扩展点契约 + ADR | `[x]` | §3 |
| Exp-B1 | 图形插件 `box`（含 AttributeHandler） | `[x]` | §4；§3 |
| Exp-T0 | 树标签：`modified-star` + `(box)` | `[x]` | §5 |
| Exp-A0 | 双装配：代码装配 + 配置装配 + 加载器 | `[x]` | §6 |
| Exp-D0 | 文档 / metrics / ADR / 收尾打 tag `p2` | `[ ]` | §7 |

**本阶段明确不做（全局 Out-of-Scope，除非选做拓展）**

- 完整 SVG 规范校验、图形预览（VSCode 扩展）
- GUI / 鼠标交互（CLI）
- 修改 Phase 1 已定义命令的既有语义与基线输出
- 拓展任务（`diamond` / `arrow` / `swimlane` / 额外扩展点）— 选做，不占评分权重

**硬约束（全程）**

- 内核只依赖扩展点**接口**，不依赖任何插件实现
- 插件以**类或类的实例**实现扩展点；不得依赖内核内部实现或宿主装配模块
- 禁用可选插件后：默认装配仍提供 Phase 1 内置命令与六种图形，行为/输出不变
- 接入新插件时：内核与既有插件的 `git diff` 差异必须为 **0**（排除新插件目录）
- 失败命令无副作用；错误前缀 `error:`
- 沿用 TypeScript OOP；记录对 AI 建议的检查与修正

---

## Exp-V0 — VSCode：SVG 文件标记

**目标**：Explorer 中 `.svg` 旁显示 `[]` 标记。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| VSCode 扩展骨架 | 可安装 / 调试启动 |
| FileDecoration / 等价机制 | 仅对 `.svg` 附加 `[]` |
| 示例 SVG | 用于演示 |

**Out-of-Scope**：大纲视图；改文件名或文件内容；非 SVG / 目录加标记。

**验收**

- [x] `.svg` 右侧出现 `[]`（代码已实现；请用 F5 在 Extension Host 中目视确认）
- [x] 普通文件与目录无标记（代码已实现；请用 F5 目视确认）
- [x] 实际文件名与内容不变（装饰 API，不改文件）

**代码位置**：`vscode-svg-extension/`

**建议 commit**：`p2: vscode svg file decoration`

---

## Exp-V1 — VSCode：SVG 大纲

**目标**：原生 Outline 展示 SVG 元素嵌套；可定位、可随编辑更新。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| DocumentSymbolProvider（或等价） | 根 / 容器 / 叶子层级 |
| 节点显示 | 有 id → `标签名#id`；无 id → 仅标签名 |
| 点击定位 | 跳到对应源码位置 |
| 编辑更新 | 内容变化后大纲刷新 |
| 残缺 XML | 允许暂时清空大纲，扩展不得崩溃 |

**Out-of-Scope**：完整 SVG 校验；图形预览；文件标记（已在 V0）。

**验收（至少覆盖）**

- [x] 嵌套分组（`pnpm run check:v1` PASS；F5 目视 Outline）
- [x] 无 id 元素（显示为 `text`）
- [x] 编辑后大纲更新（解析随文档重算；VSCode 会再次调用 provider）
- [x] 不完整 XML 不崩溃（`fixtures/broken.svg`）

**代码位置**：`vscode-svg-extension/src/SvgOutlineParser.ts`、`SvgDocumentSymbolProvider.ts`

**建议 commit**：`feat(exp-v1): vscode svg outline provider`

---

## Exp-V2 — VSCode：分析与提交材料

**目标**：补齐第一部分文档与演示证据。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| 安装 / 启动步骤 | 写入文档 |
| 截图 | 文件标记 + 大纲定位各至少一张 |
| 职责说明 | VSCode vs 插件；注册与回调过程 |
| 模式分析 | 文件装饰与 Decorator / Adaptor 的对应与差异 |
| 复用评估 | Phase 1 解析 / 模型 / 遍历哪些可复用、哪些不能及原因 |

**Out-of-Scope**：开始改 CLI 内核（放到 Exp-F0）。

**验收**

- [x] 扩展源码可运行（`pnpm run check:v2`）
- [x] 文档含 A.3 三节要求（`docs/A3_ANALYSIS.md`）
- [x] 截图与示例 SVG 齐全（`docs/images/` + `fixtures/`）

**代码位置**：`vscode-svg-extension/docs/A3_ANALYSIS.md`

**建议 commit**：`feat(exp-v2): vscode A3 analysis and demos`

---

## Exp-F0 — CLI：四个扩展点框架

**目标**：内核侧定义四个扩展点；内置能力改经注册装配；Phase 1 全回归通过。

**In-Scope**

| 扩展点 | 职责 | 本 Exp 最低要求 |
|---|---|---|
| `ShapeProvider` | 一种图形类型 | 现有六种改为经扩展点注册（行为不变） |
| `Command` | 一条可用命令 | 内置命令经注册表分发（行为不变） |
| `TreeDecorator` | 结构树行尾行标签 | 接口 + **无标签时** `tree` 逐字节不变 |
| `AttributeHandler` | 某属性在某图形上的语义 | 接口 + 无处理器时走 Phase 1 原规则 |

另需：

- [x] 扩展点接口定义在内核；内核不依赖实现（`src/extensions/*`）
- [x] 禁用任何可选插件仍能启动，Phase 1 行为不变（仅 `registerBuiltins`）
- [x] `docs/metrics/` 首次产出（`npm run metrics` / `scripts/metrics.mjs`）
- [x] 文档起草「扩展点清单」骨架（`doc/EXTENSION_POINTS.md`）

**Out-of-Scope**：`stats` / `dir` / `box` / 树标签实现 / 配置加载器（后续 Exp）。

**验收**

```bash
npm run check:f0
npm run metrics
```

- [x] 六种图形 + 内置命令经注册表分发（`check:f0` PASS）
- [x] 内核不按具体插件名枚举（`ShapeFactory` / `CommandDispatcher` 只查注册表）
- [x] 无 TreeDecorator 时 tree 根行仍为 `svg (WxH)`（无后缀）

**建议 commit**：`feat(exp-f0): scaffold four plugin extension points`

---

## Exp-C0 — 命令插件：`stats`

**目标**：独立插件包提供 `stats`；不进 undo 栈。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| `stats` 插件 | 独立于内置命令表所在包 |
| 遍历规则 | 按当前子节点顺序 DFS；叶子按类型计数（首次出现顺序）；`g`/`box` 只计 containers；根 SVG 不计 |
| `help` | 已加载时列出该命令 |

**输出示例**

```text
svg> stats
rect: 3  circle: 1  text: 2  (total 6, containers 2)
```

空文档：`(total 0, containers 0)`

**Out-of-Scope**：`dir`；配置装配（可先只走代码装配）。

**验收**

- [x] 已加载：`help` 含 `stats`；执行成功（`npm run check:c0`）
- [x] 未加载：`error: unknown command: stats`
- [x] 不改变文档状态；不进入 undo 栈
- [x] 插件包可独立启用/禁用（`createApp({ enableOptionalPlugins })`）

**代码位置**：`plugins/command-stats/`

**建议 commit**：`feat(exp-c0): add stats command plugin`

---

## Exp-C1 — 命令插件：`dir` + 适配器

**目标**：`dir` 列当前工作目录；经适配器访问文件系统；可独立测试。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| `dir` 插件 | 独立包；无参数 |
| 目录访问接口 + 适配器 | 适配器模式；文档说明角色对应 |
| 输出格式 | `[DIR]  name` / `[FILE] name`（标记后两空格）；目录在前、文件在后；各组名称升序；含隐藏项；不含 `.` / `..` |
| 边界 | 空目录 → `(empty directory)`；失败 → `error: cannot read directory: <path>` |
| 测试 | 测试替身 + 真实文件系统临时目录；稳定排序 |

**设计要点**

- CWD = 启动 CLI 时所在目录；`read`/`save` 不改变它
- 不依赖 SVG 文档；未 `init`/`read` 也可用
- 不改变文档 / dirty / CWD / undo·redo；不触发 IO 后的撤销限制

**Out-of-Scope**：递归列目录；改内核既有命令。

**验收**

- [x] 未初始化文档时 `dir` 可用（`npm run check:c1`）
- [x] 成功/失败均不改文档与历史
- [x] 可单独启用/禁用；未加载 → `error: unknown command: dir`
- [x] 替身测试与真实适配器集成测试通过
- [x] 文档写明符号链接等特殊项如何显示（`plugins/command-dir/README.md`）

**代码位置**：`plugins/command-dir/`

**建议 commit**：`feat(exp-c1): add dir command plugin with fs adapter`

---

## Exp-B0 — 属性扩展点契约

**目标**：完善 `AttributeHandler` 接口与调用契约（含冲突、undo 单元、失败回滚），并写 ADR。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| 完善后的处理器接口 | 不止 `handles` / `apply`；明确如何取图形、协作、事务 |
| `set` 流程 | 先查处理器 → 命中则由处理器改；未命中走 Phase 1 白名单规则 |
| 冲突规则 | 多处理器同时命中：拒绝 / 优先级 / 组合 — 须在 ADR 声明 |
| Undo 单元 | 一次 `set`（哪怕改多个子部件）= 一次 undo/redo |
| 失败回滚 | 部分修改后抛错 → 文档与历史回到执行前；**不得**再落入默认属性处理 |
| ADR | 属性扩展点契约（必选之一） |

**初始接口参考（须自行完善）**

```ts
export interface AttributeHandler {
  handles(shapeId: string, attr: string): boolean;
  apply(shapeId: string, attr: string, value: string): void;
}
```

**Out-of-Scope**：完整 `box` 创建/序列化（Exp-B1）；但可用测试替身验证契约。

**验收**

- [x] 无处理器：原有允许属性仍可改；未知属性 → `error: unknown attribute: <attr>`（`npm run check:b0`）
- [x] 多处理器命中行为符合 ADR（拒绝，不覆盖）
- [x] 模拟「部分修改后抛错」：内容与 undo/redo 历史不变
- [x] 多子部件一次 set = 一个 undo/redo 单元（替身）

**文档**：`doc/adr/0001-attribute-handler-contract.md`

**建议 commit**：`feat(exp-b0): attribute handler contract and ADR`

---

## Exp-B1 — 图形插件 `box`

**目标**：以插件接入 `box`；内核改动为 0；配合 AttributeHandler 实现 `fill`/`label`。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| `ShapeProvider` for `box` | `create box <id> <x> <y> <w> <h> <labelText>` |
| 结构 | 容器 + 内部 `rect`（`<id>-rect`）+ `text`（`<id>-label`） |
| 行为 | 支持 `in`；整体 `move`；可嵌套；`ungroup` 拒绝 |
| 属性 | `set <id> fill …` → 内部矩形；`set <id> label …` → 内部文字 |
| 序列化 | `data-kind="box"`；未装插件读回降级为普通 `g`（ADR 记录） |
| 边界 | 创建前检查整棵新增子树 id；冲突则整命令失败 |
| 读回 | 缺子部件/类型错误：拒绝整文件或警告降级（ADR）；重复 id 必须拒绝整文件 |
| 不变量 | 用普通命令删/移必要子部件时：拒绝或保不变量（ADR + 测试） |
| 测试 | 插件独立可测（可用测试替身上下文） |

**语义要点**：见 `phase_cli_1.md` §4.4；装上插件后须能完整复现 Phase 1 §6.1（含 box）会话。

**Out-of-Scope**：树标签 `(box)`（Exp-T0）；配置装配演示可放到 Exp-A0，本 Exp 至少代码装配可用。

**验收**

- [x] `set n1 fill` / `set n1 label` 各为一个 undo 单元（`npm run check:b1`）
- [x] 插件包独立；装配仅改 `createApp`；既有 stats/dir 插件未改
- [x] 创建 / move / ungroup 拒绝 / 读写 / 未装插件降级可复现
- [x] 读回降级与不变量：ADR-0002 + 测试

**代码位置**：`plugins/shape-box/` · ADR：`doc/adr/0002-box-readback-and-invariants.md`

**建议 commit**：`feat(exp-b1): add box shape plugin`

---

## Exp-T0 — 树标签插件

**目标**：结构树行尾可追加标签；渲染器与内核不因新标签而改。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| `modified-star` | 按所选 dirty 语义追加 `*` |
| `(box)` | box 容器行追加类型标注 |
| 状态封装 | 标签自有状态放实例字段，**禁止**模块级变量 |
| 共存 | 两标签并存且互不感知 |
| 基线 | 无标签时 `tree` 与 Phase 1 **逐字节不变** |

**必须写入 ADR 的取舍**

1. dirty：`内容≠上次保存`（undo 回保存点 `*` 消失）还是 `发生过编辑`（undo 不消失）
2. 子图形修改时，祖先容器行是否也标 `*`
3. 同一行多标签的拼接顺序
4. 新建节点是否立即标记

**Out-of-Scope**：改渲染器内核逻辑来「特判」某种标签。

**验收**

- [x] 无装饰器时 tree 基线不变；装饰器为独立插件（`npm run check:t0`）
- [x] `modified-star` 状态机：编辑 → 保存 → 再编辑 → undo 回保存点
- [x] 两标签同时启用：`g#n1 (box) *`
- [x] ADR-0003 记录 dirty / 祖先 / 顺序 / 新建

**代码位置**：`plugins/tree-star/` · `plugins/tree-box-label/` · `doc/adr/0003-tree-decorator-dirty-semantics.md`

**建议 commit**：`feat(exp-t0): tree decorators modified-star and box-label`

---

## Exp-A0 — 双装配（代码 + 配置）

**目标**：同一插件可用方式 A（改装配代码）与方式 B（改 `plugins.config.json`）装入；行为一致。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| 方式 A | 组合根 `activate(ctx)`；新增插件只改一处装配文件 |
| 方式 B | 根目录 `plugins.config.json`；加载器按模块名解析，**不硬编码**具体插件 |
| `contributes` | `shapes` / `commands` / `decorators` / `attributes`；与实际注册比对 |
| 失败处理 | 见下表；主程序继续启动，不退出 |
| 回滚 | 清单不一致 / activate 失败 / 重复注册 → 撤销该插件全部暂存注册，继续后续 |
| 双装配一致性测试 | 同一输入会话，A/B 输出逐字节相同 |

**加载失败输出**

| 失败 | 输出 |
|---|---|
| 模块找不到 | `error: plugin not found: <module>` |
| 无默认导出 | `error: plugin has no default export: <module>` |
| contributes 与注册不一致 | `error: plugin manifest mismatch: <name> (declared: …, registered: …)` |
| activate 抛错 | `error: plugin failed to activate: <name> (<reason>)` |
| 同类注册名重复 | `error: duplicate registration: <category>/<name>` |
| 配置非法 | `error: invalid plugin config`（以默认内置能力启动） |

**配置示例形态**

```json
{
  "plugins": [
    { "module": "@svgframe/plugin-shape-box" },
    { "module": "./plugins/tree-star" },
    { "module": "@svgframe/plugin-shape-diamond", "options": { "fill": "#f5a623" } },
    { "module": "@svgframe/plugin-export-png", "enabled": false }
  ]
}
```

**验收判据（摘要）**

```bash
# 方式 A：只新增插件 + 改一个顶层装配文件
# 方式 B：只新增插件 + 改配置（运行源码不动）
# 排除新插件目录后，内核与既有插件 diff 必须为空

<启动入口> < doc/transcript/cli-1.txt
<启动入口> --config plugins.config.json < doc/transcript/cli-1.txt
# 两次输出 diff 为空（插件集合/顺序/options/CWD 一致）
```

- [x] 加载器失败路径 + manifest/activate/重复注册回滚（`npm run check:a0`）
- [x] 方式 A/B 同一会话输出逐字节一致（box + stats + tree）
- [x] `plugins.config.json` + `PluginLoader`（无硬编码插件 import）
- [x] ADR-0004 配置校验时机

**入口**：`tsx src/cli/main.ts`（方式 A）· `tsx src/cli/main.ts --config plugins.config.json`（方式 B）

**建议 commit**：`feat(exp-a0): dual assembly code and config plugin loader`

---

## Exp-D0 — 文档、指标与收尾

**目标**：补齐交付物，打 tag `p2`。

**In-Scope（交付物核对）**

- [ ] 远程仓库同一仓库；tag **`p2`**
- [ ] 源码：VSCode 扩展 + CLI 内核 / 扩展点 / 插件 / 宿主与装配
- [ ] `doc/README.md`（或 Phase 2 文档）含：
  - [ ] 扩展点清单（接口名、职责、内核调用位置、实现、缺省行为、违约报错）
  - [ ] 两种装配方式与配置格式
  - [ ] 重构前后模块依赖图（PlantUML）
  - [ ] ADR ≥ 3（属性契约、读回降级、dirty/祖先传播、配置校验时机等任选）
  - [ ] `dir` 目录访问接口与适配器模式说明
  - [ ] 第一部分 A.3 说明与演示
- [ ] `docs/metrics/`：文件清单与职责；行数按「内核 / 装配处 / 插件」拆分；圈复杂度增量（`final` vs `p2`）；**脚本生成**
- [ ] 测试与 VSCode 验证证据齐全
- [ ] 迭代报告：Phase 1 → Phase 2 架构对比图

**Out-of-Scope**：移动已存在的 tag；拓展选做任务（可选另开）。

**建议最后步骤**

```bash
# 确认回归与双装配一致后
git tag p2
git push origin p2
```

**建议 commit**：`p2: docs metrics ADR and final report` → 再打 tag

---

## 验收总表（对照规格 §7）

| 项 | 扩展点 | `stats`/`dir` | `box` | 标签 | 双装配 |
|---|---|---|---|---|---|
| 接口在内核侧 | ☐ | ☐ | ☐ | ☐ | — |
| 以类实现扩展点 | ☐ | ☐ | ☐ | ☐ | — |
| 不反向依赖内核实现 | ☐ | ☐ | ☐ | ☐ | ☐ loader |
| 内核与既有插件 diff=0 | ☐ | ☐ | ☐ | ☐ | ☐ 两条判据 |
| 缺省/禁用行为正确 | ☐ | ☐ | — | ☐ 无标签逐字节不变 | — |
| 独立可测 | — | ☐ `dir` 替身+真实 | ☐ | ☐ | ☐ 失败路径 |
| 插件协作 | — | — | ☐ `(box)` | ☐ 两标签并存 | ☐ 同一插件两种装法 |
| 输出逐字节一致 | — | — | — | — | ☐ A/B |
| 适配器模式 | — | ☐ `dir` | — | — | ☐ 共用同一接口 |

---

## 推荐执行顺序（一次只做一个 Exp）

```text
Exp-V0 → Exp-V1 → Exp-V2
       → Exp-F0
       → Exp-C0 → Exp-C1
       → Exp-B0 → Exp-B1
       → Exp-T0
       → Exp-A0
       → Exp-D0（tag p2）
```

**当前激活**：`Exp-D0`（下一个未完成项）

完成一个 Exp 后：勾选本文件状态 → **自动验收** → **单独一次 commit** → **push 到远程** → 再激活下一个。  
约定：每个 Exp 结束时由 AI 按该 Exp 验收项核对，执行 commit 并 `git push`（无需再口头确认）。

---

## 拓展任务（选做，不改评分权重）

- [ ] 再注册一种形状：`diamond` / `arrow` / `swimlane`（任选）接入同一内核
- [ ] 或再加一个扩展点（导出格式、日志与编辑时长统计等）
- [ ] 或接入其他同学插件，验证契约兼容且内核无需修改
