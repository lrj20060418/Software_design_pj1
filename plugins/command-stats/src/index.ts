import type { PluginContext } from "../../../src/extensions/PluginContext.js";
import { StatsCliCommand } from "./StatsCliCommand.js";

/**
 * @svgframe/plugin-command-stats
 * 通过扩展点注册 `stats` 命令；可单独启用/禁用。
 */
export function activate(ctx: PluginContext): void {
  ctx.commands.register(new StatsCliCommand(ctx.document));
}

export default { activate };
