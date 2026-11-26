# ADR-0001：AttributeHandler 扩展点契约

- **状态**：已采纳（Exp-B0）
- **日期**：2026-11-26

## 上下文

`set <id> <attr> <value>` 需要支持插件定义的领域语义（如未来 `box` 的 `fill`/`label` 作用在子部件上），且：

1. 一次 `set` 即使改多个子部件，也必须是 **一个** undo/redo 单元；
2. 处理器中途失败必须回滚，且 **不得** 再落入 Phase 1 默认属性处理；
3. 多处理器同时声称负责时行为必须确定。

## 决策

### 1. 图形访问

处理器通过 `AttributeHandlerContext.document`（公开 `Document` API）按 id 取得 `Shape`，用 `getType()` / `getAttribute` / `setAttribute` 及容器的公开子节点 API 修改子部件。字段保持封装；处理器不依赖宿主装配模块。

### 2. 多处理器冲突：**拒绝**

若 `findHandlers` 返回多个处理器，内核输出：

`error: conflicting attribute handlers for <attr> on <id>`

不执行任何 `apply`，不入 undo 栈。不采用优先级覆盖或静默组合，避免未定义覆盖。

（若将来需要组合，须另开 ADR 变更本决策。）

### 3. Undo 单元

接口要求处理器实现：

- `captureUndoState(ctx)`：在修改前捕获 **本次可能改动的全部状态**（不透明 `AttributeUndoState`）；
- `apply(ctx)`：执行修改；
- `restoreUndoState(state)`：完整恢复。

内核用 `AttributeHandlerCommand` 包装：构造时 capture → `execute` 时 apply → `undo` 时 restore。故一次 `set` = 栈上一条命令。

### 4. 失败回滚

`AttributeHandlerCommand.execute` 在 `apply` 抛错时立刻 `restoreUndoState(before)` 并重新抛出。`History.execute` 因异常不会 push。`EditorSession.set` 捕获后返回 `error: …`，**不再**调用默认 `SetCommand`。

### 5. 与默认路径的关系

零处理器命中时，行为与 Phase 1 完全一致（`SetCommand` + 图形白名单）。

## 后果

- 插件须正确实现 capture/restore（含多子部件）；测试用替身验证。
- `box`（Exp-B1）应注册一个（或按属性拆分但避免双命中）处理器，并遵守本契约。
