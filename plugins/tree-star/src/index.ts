import type { PluginContext } from "../../../src/extensions/PluginContext.js";
import { ModifiedStarDecorator } from "./ModifiedStarDecorator.js";

export { ModifiedStarDecorator } from "./ModifiedStarDecorator.js";

export function activate(
  ctx: PluginContext,
  _options?: Record<string, unknown>,
): void {
  void _options;
  ctx.treeDecorators.register(new ModifiedStarDecorator());
}

export default { activate };
