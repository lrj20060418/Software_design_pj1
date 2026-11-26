# 扩展点清单（Exp-F0 骨架）

> 对应 `phase_cli_2.md` §1。后续 Exp 补齐插件实现时同步更新「已有实现」列。

| 接口 | 职责 | 内核调用位置 | 已有实现 | 禁用可选扩展时 | 违约/冲突报错 |
|---|---|---|---|---|---|
| `IShapeProvider` | 一种图形的 `create` / `fromSvg` | `ShapeFactory.create` / `fromSvg`（`src/model/ShapeFactory.ts`）；`SvgReader.buildShape` | 内置：`rect` `circle` `ellipse` `line` `text` `g`（`src/builtin/shapes/*`） | 六种图形仍可用 | 未注册：`error: unknown shape type: <t> (is the plugin loaded?)`；重复：`error: duplicate registration: shapes/<t>` |
| `ICliCommand` | 一条 REPL 命令 | `CommandDispatcher.dispatch`（`src/cli/CommandDispatcher.ts`） | Phase 1 全部内置；可选 `stats`（`plugins/command-stats`）、`dir`（`plugins/command-dir`） | 仅内置；未加载的可选命令 → `error: unknown command: <name>` | 未知：`error: unknown command: <name>`；重复：`error: duplicate registration: commands/<name>` |

### `dir` 与适配器模式

见 [`plugins/command-dir/README.md`](../plugins/command-dir/README.md)：`IDirectoryAccess`（Target）← `NodeFsDirectoryAccess`（Adapter）→ `fs`（Adaptee）；`DirCliCommand` 为 Client。
| `ITreeDecorator` | 结构树行尾行标签 | `EditorSession.tree` → `TreeDecoratorRegistry.createLineHook` → `Document.renderTree` | （无；后续 `modified-star` / `(box)`） | `tree` 与 Phase 1 **逐字节一致**（不传 decorate 钩子） | 重复：`error: duplicate registration: decorators/<name>` |
| `IAttributeHandler` | 属性领域语义 | `EditorSession.set` → `AttributeHandlerRegistry.findHandlers` | （无；后续 box `fill`/`label`） | 走 Phase 1 `SetCommand` 白名单 | 多处理器冲突：`error: conflicting attribute handlers…`；重复：`error: duplicate registration: attributes/<name>`；未知属性仍为 `error: unknown attribute: <attr>` |

## 装配入口

- 组合根：`src/host/createApp.ts`
- 内置注册：`src/builtin/registerBuiltins.ts`
- 插件上下文：`src/extensions/PluginContext.ts`
