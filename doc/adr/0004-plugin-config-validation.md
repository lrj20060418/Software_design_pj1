# ADR-0004：配置清单校验时机

- **状态**：已采纳（Exp-A0）
- **日期**：2026-11-26

## 决策

1. **校验时机**：在 `activate(ctx)` **成功返回之后**立即比对 `package.json#contributes` 与本插件新增的注册名集合；通过才保留注册。
2. **失败回滚**：manifest 不一致、`activate` 抛错、或注册阶段触发 `duplicate registration` 时，撤销**该插件**新增的全部注册，保留先前已成功插件，继续加载后续项。
3. **配置非法**：JSON 解析失败或缺少 `plugins` 数组 → 打印 `error: invalid plugin config`，不以可选插件启动（仅内置能力）。
4. **方式 A/B**：均调用 `activatePluginValidated`；差别只在「谁决定装哪些插件、如何得到模块实例」。

## options

配置项 `options` 原样传入 `activate(ctx, options)`；插件自行解读。相对路径模块以配置文件目录为基准解析。
