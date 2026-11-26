# `@svgframe/plugin-command-dir`（Exp-C1）

列出 CLI **进程当前工作目录**（启动时锁定）下的直接子项。

## 适配器模式角色

| 角色 | 本插件中的对应 |
|---|---|
| **Target** | `IDirectoryAccess`（命令依赖的目录访问接口） |
| **Client** | `DirCliCommand`（只调用 `list`，格式化输出） |
| **Adapter** | `NodeFsDirectoryAccess`（把 Node `fs.readdirSync` 转成 `DirectoryEntry[]`） |
| **Adaptee** | Node.js `fs` 模块 |
| **测试替身** | `FakeDirectoryAccess`（内存表，不碰磁盘） |

## 符号链接与特殊项

- 使用 `fs.readdirSync({ withFileTypes: true })` 的 `Dirent` 判断。
- `isDirectory()` 为真 → `[DIR]`（含指向目录的符号链接）。
- 其余（普通文件、指向文件的链接、socket 等）→ `[FILE]`。
- **不** `realpath`、**不**递归进入链接目标。

## 启用

代码装配：`createApp()` 默认 `activate(ctx)`；`enableOptionalPlugins: false` 或 `plugins.dir: false` 可禁用。
