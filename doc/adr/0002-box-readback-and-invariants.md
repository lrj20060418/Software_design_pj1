# ADR-0002：box 读回降级与不变量

- **状态**：已采纳（Exp-B1）
- **日期**：2026-11-26

## 上下文

`box` 序列化为 `<g data-kind="box">` + 必要子部件。读回与运行期都可能破坏「必有 `id-rect` / `id-label`」的不变量。

## 决策

### 1. 未装插件时的读回

`ShapeFactory.resolveReadType`：仅当 `data-kind` 对应 Provider **已注册**时才用逻辑类型；否则按标签 `g` 读成普通 `Group`。  
→ 未装 box 插件时降级为普通分组，不报错、不生成残缺 box。

### 2. 已装插件但结构非法

`BoxShapeProvider.complete` 在子节点挂载后校验：

- 必须存在 `Rect` 且 id 为 `<id>-rect`
- 必须存在 `Text` 且 id 为 `<id>-label`

失败则抛 `error: invalid box structure: …`，**拒绝整个 read**（`SvgReader` 向上抛错，会话保持读入前文档）。不生成不完整 box 对象。

重复 id 仍由读入/登记路径按全局唯一性拒绝整文件。

### 3. 运行期拆子部件

`Shape.allowsChildRemoval`：`Box` 对必要子部件返回 `false`。  
`Document.removeSubtree` / `unlinkFromParent` 在卸下前检查，失败：

`error: cannot remove required child from composite: <id>`

从而拒绝 `delete <id>-rect`、`addto` 移走必要子部件等。删除整个 box（`delete n1`）不受影响。

### 4. ungroup

`Box.canUngroup() === false` → `error: cannot ungroup composite shape: <id>`。

## 后果

- 内核无 `box` 字面量分支；能力经 Provider / Shape 多态钩子扩展。
- 树标注 `g#id (box)` 暂由 `Box.treeLabel()` 提供；Exp-T0 可用 TreeDecorator 承接。
