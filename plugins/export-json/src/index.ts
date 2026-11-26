import type { PluginContext } from "../../../src/extensions/PluginContext.js";
import { JsonDocumentExporter } from "./JsonDocumentExporter.js";

export { JsonDocumentExporter } from "./JsonDocumentExporter.js";

/**
 * @svgframe/plugin-export-json
 */
export function activate(
  ctx: PluginContext,
  _options?: Record<string, unknown>,
): void {
  void _options;
  ctx.exporters.register(new JsonDocumentExporter());
}

export default { activate };
