# 扩展点清单（Phase 2）

> 对应 `phase_cli_2.md` §1。须能据此核验接口、调用点与报错。

| 接口 | 职责 | 内核调用位置 | 已有实现 | 禁用可选扩展时 | 违约/冲突报错 |
|---|---|---|---|---|---|
| `IShapeProvider` | 一种图形的 `create` / `fromSvg` / 可选 `complete` | `ShapeFactory`（`src/model/ShapeFactory.ts`）；`SvgReader` → `resolveReadType`（`data-kind`，**含叶子**） | 内置六种（`src/builtin/shapes/*`）+ 可选 `box` / `diamond`（`plugins/shape-*`） | 仅六种；`create box|diamond` → unknown shape type | 未注册 / 重复：`error: duplicate registration: shapes/<name>`；非法 box 在 `complete` 拒绝整次 read |
| `ICliCommand` | 一条 REPL 命令（含 `helpLines`） | `CommandDispatcher.dispatch`（`src/cli/CommandDispatcher.ts`） | Phase 1 内置（`src/builtin/commands/*`）；可选 `stats`、`dir` | 仅内置；未装可选命令 → `error: unknown command: <name>` | 重复：`error: duplicate registration: commands/<name>` |
| `ITreeDecorator` | 结构树行尾行标签；可选 `onAfterSave` / `onAfterReset` | `EditorSession.tree`；save / init / read 后通知装饰器 | `modified-star`（`plugins/tree-star`）、`box-type-label`（`plugins/tree-box-label`） | 无装饰器时 `createLineHook` 返回 `undefined`，`tree` 与 Phase 1 **逐字节**一致 | 重复：`error: duplicate registration: decorators/<name>`；语义见 ADR-0003 |
| `IAttributeHandler` | 属性在特定图形上的领域语义 | `EditorSession.set` → `AttributeHandlerRegistry.findHandlers` → `AttributeHandlerCommand` | `box` 的 `fill` / `label`（`plugins/shape-box`） | 无命中走 Phase 1 `SetCommand` 白名单 | 多命中拒绝；`apply` 失败回滚且不入栈；重复：`error: duplicate registration: attributes/<name>`；未知属性仍为 `error: unknown attribute` |

契约详情：

- [`doc/adr/0001-attribute-handler-contract.md`](./adr/0001-attribute-handler-contract.md)
- [`doc/adr/0002-box-readback-and-invariants.md`](./adr/0002-box-readback-and-invariants.md)
- [`doc/adr/0003-tree-decorator-dirty-semantics.md`](./adr/0003-tree-decorator-dirty-semantics.md)
- [`doc/adr/0004-plugin-config-validation.md`](./adr/0004-plugin-config-validation.md)

---

## `dir` 与适配器模式

详见 [`plugins/command-dir/README.md`](../plugins/command-dir/README.md)。

| 角色 | 对应 |
|---|---|
| Target | `IDirectoryAccess` |
| Client | `DirCliCommand` |
| Adapter | `NodeFsDirectoryAccess` |
| Adaptee | Node.js `fs` |
| Test double | `FakeDirectoryAccess` |

命令只依赖 `IDirectoryAccess.list`；真实 FS 与测试替身可互换。两种装配（代码 / 配置）共用同一插件入口与接口。

---

## 装配入口

| 方式 | 入口 | 说明 |
|---|---|---|
| A 代码装配 | `src/host/createApp.ts`（`assembly: "code"`，默认） | 组合根显式 `activate`；新增插件只改此处 |
| B 配置装配 | `plugins.config.json` + `PluginLoader` | 按模块名动态 `import`；**不**硬编码具体插件 |
| 共用校验 | `activatePluginValidated`（`src/host/activatePlugin.ts`） | contributes 比对；失败回滚该插件注册 |

### 配置格式

```json
{
  "plugins": [
    { "module": "./plugins/shape-box" },
    { "module": "./plugins/command-stats" },
    { "module": "./plugins/command-dir" },
    { "module": "./plugins/tree-box-label" },
    { "module": "./plugins/tree-star" },
    { "module": "./plugins/example", "enabled": false, "options": { "fill": "#f5a623" } }
  ]
}
```

### 启动

```bash
npx tsx src/cli/main.ts                              # 方式 A
npx tsx src/cli/main.ts --config plugins.config.json # 方式 B
```

加载失败文案见 ADR-0004 / Exp-A0（`error: plugin not found` / `no default export` / `manifest mismatch` / `failed to activate` / `duplicate registration` / `invalid plugin config`）。
