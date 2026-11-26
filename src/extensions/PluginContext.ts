import { AttributeHandlerRegistry } from "./AttributeHandlerRegistry.js";
import { CommandRegistry } from "./CommandRegistry.js";
import { ShapeRegistry } from "./ShapeRegistry.js";
import { TreeDecoratorRegistry } from "./TreeDecoratorRegistry.js";

/**
 * 插件激活时拿到的扩展上下文（内核公开面）。
 * 插件只依赖本上下文与扩展点接口，不依赖宿主装配细节。
 */
export class PluginContext {
  readonly shapes = new ShapeRegistry();
  readonly commands = new CommandRegistry();
  readonly treeDecorators = new TreeDecoratorRegistry();
  readonly attributes = new AttributeHandlerRegistry();
}
