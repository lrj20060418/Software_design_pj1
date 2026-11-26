import type { PluginContext } from "../../../src/extensions/PluginContext.js";
import { DiamondShapeProvider } from "./DiamondShapeProvider.js";

export { Diamond } from "./Diamond.js";
export { DiamondShapeProvider } from "./DiamondShapeProvider.js";

/**
 * @svgframe/plugin-shape-diamond
 * options.fill — 默认填充色（缺省 #f5a623）
 */
export function activate(
  ctx: PluginContext,
  options?: Record<string, unknown>,
): void {
  const fill =
    typeof options?.fill === "string" && options.fill.length > 0
      ? options.fill
      : "#f5a623";
  ctx.shapes.register(new DiamondShapeProvider(fill));
}

export default { activate };
