import type { Document } from "../model/Document.js";
import type { History } from "../history/History.js";
import { AttributeHandlerRegistry } from "./AttributeHandlerRegistry.js";
import { CommandRegistry } from "./CommandRegistry.js";
import { ExporterRegistry } from "./ExporterRegistry.js";
import { ShapeRegistry } from "./ShapeRegistry.js";
import { TreeDecoratorRegistry } from "./TreeDecoratorRegistry.js";

/**
 * 插件激活时拿到的扩展上下文（内核公开面）。
 * 插件可依赖 Document 等公开领域抽象与扩展点接口，
 * 不得依赖宿主装配模块内部实现。
 */
export class PluginContext {
  readonly shapes = new ShapeRegistry();
  readonly commands = new CommandRegistry();
  readonly treeDecorators = new TreeDecoratorRegistry();
  readonly attributes = new AttributeHandlerRegistry();
  readonly exporters = new ExporterRegistry();

  constructor(
    readonly document: Document,
    readonly history: History,
  ) {}
}
