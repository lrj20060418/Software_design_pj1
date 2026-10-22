# AI 协作护栏（约束 AI + 约束生成代码）

> 权威需求：仓库根目录 [`phase_cli_1.md`](../phase_cli_1.md)  
> 架构方案：[`doc/README.md`](./README.md)  
> 任务边界：[`doc/TASK_BOUNDARIES.md`](./TASK_BOUNDARIES.md)  
>
> 本文档约束**人如何提问**、**AI 如何回答/改码**、**生成代码必须遵守的范式**。与作业「过程记录」配套：发现 AI 违规时，记入 `doc/README.md` 过程记录并纠正。

---

## 0. 总原则

| # | 原则 | 含义 |
|---|---|---|
| 1 | **规格优先** | `phase_cli_1.md` > 本护栏 > `doc/README.md` 架构；冲突时改代码/方案，不改作业规格 |
| 2 | **一次一块** | AI 每次只做当前 Experiment 边界内的事（见 TASK_BOUNDARIES）；禁止一次生成全命令表 |
| 3 | **先方案后代码** | 改模块边界 / 依赖方向 / 新模式前，先改文档再改代码 |
| 4 | **可验证** | 每块交付必须附最小验收命令序列（来自规格第 6 节或本 Experiment 清单） |
| 5 | **过程可提交** | 禁止 one-shot 大提交；每完成一个 Experiment 至少一次 git commit |

---

## 1. 对 AI 的行为禁令（MUST NOT）

AI **不得**：

1. **越界实现**：当前 Experiment 未列出的命令、类、文件一律不写（可留 `// TODO Exp-N` 一行，禁止提前写满实现）。
2. **实现 `box` / 插件系统**：规格 4.4 明确为本阶段不要求；`create box` 仅允许报 `error: unknown shape type: box (is the plugin loaded?)`。
3. **违反依赖方向**（见架构方案）：
   - `model` 不得 import `cli` / `io` / `commands` / `history`
   - `io` 不得 import `commands` / `cli`
   - `history` 只依赖 `ICommand`，不依赖具体 Command 类
4. **贫血模型 + 过程式分派**：禁止「公共数据袋 + 到处 `switch(tag)`」；按名字分派**只允许两处**——命令分发、图形工厂——且须在架构方案标注待重构。
5. **自由函数堆业务**：编辑语义放在 `Shape` / `*Command` 的方法里，不写 `function moveShape(...)` 式全局过程。
6. **擅自改错误文案**：错误必须 `error:` 前缀，文案对齐规格 4.2；成功回显对齐规格第 6 节 transcript 风格。
7. **命令失败却改状态**：校验失败则不修改 Document / History。
8. **静默扩大范围**：不得以「顺便重构」「顺便补测试框架」「顺便加 prettier」为名改无关文件；用户未点名则不做。
9. **编造规格**：规格未写的行为（如路径寻址、鼠标、GUI）不实现、不在 help 里宣传。
10. **破坏 git 过程**：不得建议把全部功能打成单次 commit；不得擅自 `git push --force` / 改 git config。

---

## 2. 对 AI 的行为要求（MUST）

AI **必须**：

1. 动手前先声明：**当前 Experiment 编号 + In-Scope / Out-of-Scope**（复制 TASK_BOUNDARIES 对应表）。
2. 新类遵守：**一类一文件，文件名 = 类名**（TypeScript OOP）。
3. 可编辑命令走 **Command 模式**：实现 `ICommand`（`execute` / `undo`），经 `History.execute` 入栈；显示类不入栈；IO 类调用 `clearAfterIo`。
4. 容器与叶子统一：`move` / `scale` / `set` / `delete` 等对 `g` 与叶子同接口（Composite）。
5. id **唯一、大小写敏感**；CLI `create`/`group` 的 id 必填；`read` 缺 id 才自动补并 `warning:`。
6. 改完给出：**改了哪些文件**、**如何本地验收**（`npm run cli` + 命令序列）。
7. 发现自身或既有代码违反护栏时：**先指出违反点**，再给最小修复，并提醒写入过程记录。

---

## 3. 生成代码硬约束（对照规格 2 / 2.1）

### 3.1 运行与交互

| 项 | 约束 |
|---|---|
| 提示符 | `svg>` |
| 注释 | `#` 开头整行忽略 |
| 带空格参数 | 双引号包裹（`tokenize` 已提供则复用） |
| 未 init/read | `error: no document. use 'init' or 'read' first` |
| 技术栈 | TypeScript + Node；入口 `npm run cli` |

### 3.2 模块落点

| 代码类型 | 必须放在 |
|---|---|
| REPL / 分派 / 解析 | `src/cli/` |
| `ICommand` 与具体命令类 | `src/commands/` |
| Document / Shape / Group / 叶子 | `src/model/` |
| undo/redo | `src/history/` |
| 读盘写盘 | `src/io/` |

### 3.3 undo / redo（规格 4.3）

- 一条编辑命令 = 一个 undo 单元（含 `group` 多 id 整次）。
- `tree` / `show` / `help`：不进栈。
- `init` / `read` / `save` / `canvas`（改尺寸）之后：`error: undo not allowed after io command`，直到再次编辑解禁。
- undo 后若有新编辑：清空 redo 栈。

### 3.4 禁止的代码味道（示例）

```typescript
// ❌ BAD：贫血 + 过程式
type ShapeData = { tag: string; attrs: Record<string, string> };
function applyOp(s: ShapeData, op: string) {
  switch (s.tag) { /* ... */ }
  switch (op) { /* ... */ }
}

// ✅ GOOD：多态在类型上
abstract class Shape {
  abstract move(dx: number, dy: number): void;
}
```

```typescript
// ❌ BAD：第三个按名字分派点（散落在 util）
export function handle(name: string) { switch (name) { ... } }

// ✅ GOOD：仅 Dispatcher + ShapeFactory 两处
```

---

## 4. 推荐提问模板（约束人）

复制使用，减少 AI 跑飞：

```text
按 doc/TASK_BOUNDARIES.md 的 Exp-N 执行。
In-Scope：只做该节列出的命令/类。
Out-of-Scope：不要做其他命令，不要 box，不要改架构依赖方向。
验收：用该节「验收脚本」跑通。
若发现与 phase_cli_1.md 冲突，停止实现并指出冲突点。
```

---

## 5. AI 输出自检清单（每轮结束勾选）

- [ ] 未超出当前 Exp 边界  
- [ ] 未引入 `box` / 插件框架  
- [ ] 依赖方向未违反  
- [ ] 无新的「按名字 switch」散落点  
- [ ] 错误文案带 `error:` 且尽量对齐 4.2  
- [ ] 失败命令零副作用  
- [ ] 给出验收命令序列  
- [ ] 建议的 commit 粒度对应单个 Exp（不打包）

---

## 6. 违规处理（写进过程记录）

记录格式建议：

```markdown
### YYYY-MM-DD Exp-N
- AI 建议/代码问题：…
- 对照规格条款：§…
- 确认方式：跑了哪些命令 / 看了哪些 import
- 纠正：…
```
