# SVG Explorer Badge（Exp-V0）

在 VSCode Explorer 中为 `.svg` 文件旁显示 `[]` 标记。标记是界面附加信息，**不修改文件名或文件内容**；非 SVG 文件和目录不加标记。

## 安装 / 启动（调试）

1. 用 VSCode / Cursor 打开本目录 `vscode-svg-extension`（不要只打开仓库根，除非自行配置多根工作区）。
2. 安装依赖并编译（本机若 `npm install` 异常，可用 `pnpm`）：

```bash
cd vscode-svg-extension
pnpm install   # 或：npm install
pnpm run compile
```

也可在**仓库根目录**打开工程后，直接选调试配置 **Run SVG Extension (Exp-V0)** 按 `F5`。

3. 按 `F5`（或运行调试配置 **Run SVG Extension**）。
4. 会打开 Extension Development Host，并加载 `fixtures` 文件夹。
5. 在资源管理器中确认：
   - `example.svg` 右侧有 `[]`
   - `plain.txt`、`session.txt`、目录无标记
   - 文件名与内容未被改动

## 实现说明

| 类 / 入口 | 职责 |
|---|---|
| `src/extension.ts` | `activate` 时向 VSCode 注册装饰提供者 |
| `src/SvgFileDecorationProvider.ts` | 实现 `FileDecorationProvider`；仅对 `.svg` 返回 badge `[]` |

VSCode 在 Explorer 渲染文件时调用 `provideFileDecoration(uri)`；本扩展只在后缀为 `.svg` 时返回装饰，否则返回 `undefined`（不加标记）。

## 示例文件

见 [`fixtures/`](./fixtures/)：`example.svg`（应有标记）、`plain.txt` / `session.txt`（不应有标记）。
