import type { PluginContext } from "../../../src/extensions/PluginContext.js";
import { BoxTypeLabelDecorator } from "./BoxTypeLabelDecorator.js";

export { BoxTypeLabelDecorator } from "./BoxTypeLabelDecorator.js";

export function activate(
  ctx: PluginContext,
  _options?: Record<string, unknown>,
): void {
  void _options;
  ctx.treeDecorators.register(new BoxTypeLabelDecorator());
}

export default { activate };
