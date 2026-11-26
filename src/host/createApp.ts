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

export interface App {
  readonly ctx: PluginContext;
  readonly document: Document;
  readonly history: History;
  readonly session: EditorSession;
  readonly dispatcher: CommandDispatcher;
}

/**
 * 组合根：创建扩展上下文、注册内置能力、装配 REPL 分发器。
 * 可选插件稍后在此 `activate`；禁用可选插件时行为与 Phase 1 一致。
 */
export function createApp(): App {
  const ctx = new PluginContext();
  registerBuiltinShapes(ctx);

  const document = new Document();
  const history = new History();
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

  const dispatcher = new CommandDispatcher(ctx.commands);
  return { ctx, document, history, session, dispatcher };
}
