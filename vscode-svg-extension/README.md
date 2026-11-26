# SVG Explorer Badge & Outline（Exp-V0 / Exp-V1）

- **Exp-V0**：Explorer 中 `.svg` 旁显示 `[]`（不改文件名/内容）
- **Exp-V1**：打开 SVG 后，原生 Outline 展示元素嵌套；点击定位；编辑后更新；残缺 XML 不崩溃

## 安装 / 启动（调试）

1. 用 VSCode / Cursor 打开本目录 `vscode-svg-extension`，或打开**仓库根目录**。
2. 安装依赖并编译（本机若 `npm install` 异常，可用 `pnpm`）：

```bash
cd vscode-svg-extension
pnpm install   # 或：npm install
pnpm run compile
```

3. 按 `F5`（仓库根选 **Run SVG Extension (Exp-V0)**，或本目录选 **Run SVG Extension**）。
4. Extension Development Host 会加载 `fixtures`。
5. 验收：
   - Explorer：`example.svg` 有 `[]`；`plain.txt` / 目录无标记
   - 打开 `example.svg`，在 **大纲 (Outline)** 中应看到 `svg → g#flow → rect#start / g#nested → text`
   - 点击 `rect#start` 应跳到对应源码行
   - 编辑后大纲刷新；打开 `broken.svg` 不崩溃（大纲可暂时为空或部分）

## 静态验收

```bash
pnpm run check:v0
pnpm run check:v1
```

## 实现说明

| 类 / 入口 | 职责 |
|---|---|
| `src/extension.ts` | 注册文件装饰与 DocumentSymbolProvider |
| `src/SvgFileDecorationProvider.ts` | `.svg` → badge `[]` |
| `src/SvgOutlineParser.ts` | 纯解析：嵌套树 / `tag#id` / 残缺容错 |
| `src/SvgDocumentSymbolProvider.ts` | 将解析树映射为 Outline 符号 |

## 示例文件

见 [`fixtures/`](./fixtures/)：`example.svg`、`broken.svg`、`plain.txt`、`session.txt`。

## A.3 分析与演示（Exp-V2）

完整说明（职责、Decorator/Adaptor、Phase 1 复用评估、截图）见：

- [`docs/A3_ANALYSIS.md`](./docs/A3_ANALYSIS.md)
- 截图：[`docs/images/svg-badge.jpg`](./docs/images/svg-badge.jpg)、[`docs/images/svg-outline.jpg`](./docs/images/svg-outline.jpg)
