# 分步实验任务边界（Experiment Plan）

> 依据 [`phase_cli_1.md`](../phase_cli_1.md) 命令总表与第 6 节 transcript。  
> AI 与人类开发均以 **当前唯一激活的 Exp** 为准；完成并 commit 后再激活下一个。  
> 护栏见 [`AI_GUARDRAILS.md`](./AI_GUARDRAILS.md)。

**状态图例**：`[x]` 已完成 · `[ ]` 未做 · `[~]` 进行中

---

## 总览

| Exp | 主题 | 状态 | 对应规格 |
|---|---|---|---|
| Exp-0 | 工程骨架 + REPL + `help`/`init` | `[x]` | §2 提示符；文档类 init |
| Exp-1 | 图形模型 + `create` + `tree`/`show` | `[x]` | §4.1；§5 |
| Exp-2 | Command + `move`/`set`/`delete` + undo/redo | `[x]` | §3 编辑类；§4.3 |
| Exp-3 | 结构：`group`/`ungroup`/`addto`/`front`/`back` | `[ ]` | §3；§4.2 错误 |
| Exp-4 | `scale` + `canvas` | `[ ]` | §3；§4.2 scale |
| Exp-5 | `save`/`read` + 缺 id 警告 | `[ ]` | §3 文档类；§0 SVG |
| Exp-6 | 错误表打磨 + 第 6 节全会话验收 | `[ ]` | §4.2；§6 |
| Exp-7 | 文档定稿 + tag `final` | `[ ]` | §1 提交 |

**本阶段明确不做（全局 Out-of-Scope）**

- `create box` / ShapeProvider 插件 / `data-kind` 还原（§4.4）
- GUI、鼠标、路径寻址（如 XPath）
- 未在命令总表出现的命令

---

## Exp-0 — 骨架（已完成）

**In-Scope**：目录、`npm run cli`、`tokenize`、`help`、`init`、History/Document 空壳、架构文档初稿。

**Out-of-Scope**：一切其它命令。

**验收**：

```text
svg> help
svg> init 800 600
canvas 800x600 created
```

---

## Exp-1 — 创建与显示

**目标**：能建六种内置图形并查看结构。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| 叶子类 | `Rect` `Circle` `Ellipse` `Line` `Text`（一类一文件） |
| 工厂 | `ShapeFactory`（按名字分派第二处；文档标注待重构） |
| 命令 | `create`（含可选 `in <containerId>`）、`tree`、`show` |
| Document | id 索引、根下子节点、挂到 `g` |

**Out-of-Scope**：`move`/`undo`/`group`/`save`/`read`/`scale`…

**错误（本 Exp 必须对齐）**

- `error: id already exists: …`
- `error: no such container: …` / `error: not a container: …`
- `error: unknown shape type: … (is the plugin loaded?)`
- `error: no document. use 'init' or 'read' first`

**验收脚本（最小）**

```text
svg> init 800 600
svg> create rect bg 0 0 800 600 #ffffff
svg> create text title 20 40 "My Diagram"
svg> create circle c1 100 100 20 red
svg> create g node1
svg> create rect start 120 100 160 60 #4a90d9 in node1
svg> tree
svg> show c1
```

**完成定义**：`tree` 属性内联格式接近规格 §5.1；`create box` 报 unknown shape type。

**建议 commit**：`feat(exp-1): create shapes with tree/show`

---

## Exp-2 — 编辑与撤销

**目标**：Command 模式落地；可撤销编辑。

**In-Scope**

| 交付物 | 说明 |
|---|---|
| 命令类 | `MoveCommand` `SetCommand` `DeleteCommand`（及必要基类） |
| CLI | `move` `set` `delete` `undo` `redo` |
| History | `execute` / IO 锁 / redo 清空规则 |

**Out-of-Scope**：`group`/`save`/`read`/`scale`（可先拒绝为 unknown command）。

**`set` 白名单**：`fill`/`stroke`/`stroke-width` + 各类型几何 + text 的 `text`；其它 → `error: unknown attribute: …`

**验收脚本**

```text
svg> init 800 600
svg> create circle c1 100 100 20 red
svg> move c1 30 0
svg> undo
svg> redo
svg> set c1 fill blue
svg> delete c1
svg> undo
```

**完成定义**：一条编辑 = 一个 undo 单元；显示类不进栈。

**建议 commit**：`feat(exp-2): move/set/delete with undo redo`

---

## Exp-3 — 分组与 z-order

**In-Scope**：`group` `ungroup` `addto` `front` `back` + 对应 Command（均可 undo）。

**必须覆盖的错误（§4.2）**

- `error: cannot group a container into its own descendant: …`
- `error: cannot ungroup top-level container: …`
- `error: cannot ungroup composite shape: …`（若尚无复合类型，可先实现接口预留，无触发路径亦可）

**验收脚本**

```text
svg> init 800 600
svg> create circle c1 100 100 20 red
svg> create rect box 200 80 60 60 #3366ff
svg> group markers c1 box
svg> tree
svg> group bad c1 markers
error: cannot group a container into its own descendant: markers
svg> ungroup markers
```

**Out-of-Scope**：文件 IO、`scale`。

**建议 commit**：`feat(exp-3): group/ungroup/addto/z-order`

---

## Exp-4 — 缩放与画布

**In-Scope**：`scale <id> <factor>`（容器递归）；`canvas` 查询/修改尺寸。

**约束**

- `factor <= 0` → `error: scale factor must be positive`
- `canvas` 改尺寸属 IO 类：之后禁止 undo，直到新编辑
- 缩放：factor 同乘到该图形全部几何属性（位置与尺寸）

**验收脚本**

```text
svg> init 400 300
svg> create rect r1 10 20 100 50
svg> scale r1 2
svg> canvas
svg> canvas 800 600
svg> undo
error: undo not allowed after io command
```

**建议 commit**：`feat(exp-4): scale and canvas`

---

## Exp-5 — 读写 SVG

**In-Scope**：`SvgReader` / `SvgWriter`；`save [file]`；`read <file>`；缺 id → `warning: assigned id rect1 to unnamed <rect>`；无参 `save` 用读入路径。

**Out-of-Scope**：插件 `data-kind`；美化无关 XML 工具链大升级（可用最小可用解析）。

**错误**

- `error: cannot read file: …` / `error: cannot write file: …`

**验收**：规格 §6 中 `save demo.svg` + `read other.svg`（含缺 id 的 `other.svg` fixture）。

**建议 commit**：`feat(exp-5): save and read svg`

---

## Exp-6 — 对齐规格与质量

**In-Scope**

- 逐条核对 §4.2 错误表
- 完整回放 §6 与 §6.1 版本 A（**不要**版本 B / box）
- 浏览器或 SVG Preview 打开导出文件
- 抽样检查 import 依赖方向 → 更新 `doc/README.md` 一致性自查

**Out-of-Scope**：新功能。

**建议 commit**：`test(exp-6): align transcript and error table`

---

## Exp-7 — 提交收尾

**In-Scope**

- 补全 `doc/README.md`：过程记录、一致性自查、质量保证
- 过程记录引用 AI 违规/纠正（来自护栏 §6）
- 推远程；打 tag `final`（截止前）

**Out-of-Scope**：功能返工以外的大重构。

---

## 给 AI 的激活指令（单次只贴一段）

```text
激活 Exp-1。严格遵守 doc/AI_GUARDRAILS.md 与 doc/TASK_BOUNDARIES.md。
只实现 Exp-1 的 In-Scope；Out-of-Scope 与全局不做项一律拒绝。
结束后列出文件变更，并给出验收脚本实际输出要点。
```

将 `Exp-1` 换成当前编号即可。
