import { Document } from "../model/Document.js";
import { History } from "../history/History.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { PluginContext } from "../extensions/PluginContext.js";
import {
  registerBuiltinCommands,
  registerBuiltinShapes,
} from "../builtin/registerBuiltins.js";
import { EditorSession } from "./EditorSession.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";
import { activate as activateStats } from "../../plugins/command-stats/src/index.js";

export interface CreateAppOptions {
  /**
   * 是否启用可选命令/图形等插件（代码装配）。
   * 默认 true；设为 false 时仅内置能力（Phase 1 兼容 / 基线对比）。
   */
  enableOptionalPlugins?: boolean;
}

export interface App {
  readonly ctx: PluginContext;
  readonly document: Document;
  readonly history: History;
  readonly session: EditorSession;
  readonly dispatcher: CommandDispatcher;
}

/**
 * 组合根：创建扩展上下文、注册内置能力、按需 activate 可选插件。
 */
export function createApp(options: CreateAppOptions = {}): App {
  const enableOptionalPlugins = options.enableOptionalPlugins !== false;

  const document = new Document();
  const history = new History();
  const ctx = new PluginContext(document, history);

  registerBuiltinShapes(ctx);

  const shapeFactory = new ShapeFactory(ctx.shapes);

  const session = new EditorSession(
    document,
    history,
    shapeFactory,
    ctx.commands,
    ctx.treeDecorators,
    ctx.attributes,
  );

  registerBuiltinCommands(ctx, session);

  if (enableOptionalPlugins) {
    activateStats(ctx);
  }

  const dispatcher = new CommandDispatcher(ctx.commands);
  return { ctx, document, history, session, dispatcher };
}
