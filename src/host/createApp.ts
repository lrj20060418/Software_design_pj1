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
import {
  activate as activateDir,
  type DirPluginOptions,
} from "../../plugins/command-dir/src/index.js";

export interface CreateAppOptions {
  /**
   * 是否默认启用可选插件。默认 true。
   * 单项可用 `plugins.stats` / `plugins.dir` 覆盖。
   */
  enableOptionalPlugins?: boolean;
  plugins?: {
    stats?: boolean;
    dir?: boolean;
  };
  /** 传给 dir 插件（测试注入 cwd / FakeDirectoryAccess） */
  dir?: DirPluginOptions;
}

export interface App {
  readonly ctx: PluginContext;
  readonly document: Document;
  readonly history: History;
  readonly session: EditorSession;
  readonly dispatcher: CommandDispatcher;
}

function pluginEnabled(
  options: CreateAppOptions,
  name: "stats" | "dir",
): boolean {
  const fallback = options.enableOptionalPlugins !== false;
  return options.plugins?.[name] ?? fallback;
}

/**
 * 组合根：创建扩展上下文、注册内置能力、按需 activate 可选插件。
 */
export function createApp(options: CreateAppOptions = {}): App {
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

  if (pluginEnabled(options, "stats")) {
    activateStats(ctx);
  }
  if (pluginEnabled(options, "dir")) {
    activateDir(ctx, options.dir ?? {});
  }

  const dispatcher = new CommandDispatcher(ctx.commands);
  return { ctx, document, history, session, dispatcher };
}
