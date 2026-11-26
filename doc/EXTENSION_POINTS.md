# 扩展点清单（Exp-F0 骨架）

> 对应 `phase_cli_2.md` §1。后续 Exp 补齐插件实现时同步更新「已有实现」列。

| 接口 | 职责 | 内核调用位置 | 已有实现 | 禁用可选扩展时 | 违约/冲突报错 |
|---|---|---|---|---|---|
| `IShapeProvider` | 一种图形的 `create` / `fromSvg` / 可选 `complete` | `ShapeFactory`；`SvgReader`（`data-kind` → `resolveReadType`） | 内置六种 + 可选 `box`（`plugins/shape-box`） | 仅六种；`create box` → unknown shape type | 未注册 / 重复注册报错；非法 box 结构在 `complete` 拒绝整次 read |
| `ICliCommand` | 一条 REPL 命令 | `CommandDispatcher.dispatch`（`src/cli/CommandDispatcher.ts`） | Phase 1 全部内置；可选 `stats`（`plugins/command-stats`）、`dir`（`plugins/command-dir`） | 仅内置；未加载的可选命令 → `error: unknown command: <name>` | 未知：`error: unknown command: <name>`；重复：`error: duplicate registration: commands/<name>` |

### `dir` 与适配器模式

见 [`plugins/command-dir/README.md`](../plugins/command-dir/README.md)：`IDirectoryAccess`（Target）← `NodeFsDirectoryAccess`（Adapter）→ `fs`（Adaptee）；`DirCliCommand` 为 Client。
| `ITreeDecorator` | 结构树行尾行标签；可选 `onAfterSave` / `onAfterReset` | `EditorSession.tree` / save·init·read 通知 | `modified-star`、`box-type-label` | 无装饰器时 `tree` 逐字节不变 | 重复注册报错；语义见 ADR-0003 |
| `IAttributeHandler` | 属性领域语义 | `EditorSession.set` → `findHandlers` → `AttributeHandlerCommand` | 契约已定（ADR-0001）；业务实现见 Exp-B1 `box` | 走 Phase 1 `SetCommand` 白名单 | 多命中拒绝；`apply` 失败回滚且不入栈；重复注册报错；未知属性仍为 `error: unknown attribute` |

契约详情：[`doc/adr/0001-attribute-handler-contract.md`](./adr/0001-attribute-handler-contract.md)

## 装配入口

- 组合根：`src/host/createApp.ts`
- 内置注册：`src/builtin/registerBuiltins.ts`
- 插件上下文：`src/extensions/PluginContext.ts`
