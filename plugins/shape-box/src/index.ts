import type { PluginContext } from "../../../src/extensions/PluginContext.js";
import { BoxAttributeHandler } from "./BoxAttributeHandler.js";
import { BoxShapeProvider } from "./BoxShapeProvider.js";

export { Box, rectId, labelId } from "./Box.js";
export { BoxShapeProvider } from "./BoxShapeProvider.js";
export { BoxAttributeHandler } from "./BoxAttributeHandler.js";

/**
 * @svgframe/plugin-shape-box
 */
export function activate(
  ctx: PluginContext,
  _options?: Record<string, unknown>,
): void {
  void _options;
  ctx.shapes.register(new BoxShapeProvider());
  ctx.attributes.register(new BoxAttributeHandler());
}

export default { activate };
