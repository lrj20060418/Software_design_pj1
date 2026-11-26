import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
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
import { activatePluginValidated } from "./activatePlugin.js";
import { contributesFromPackageJson } from "./pluginManifest.js";
import { loadPluginsFromConfig } from "./PluginLoader.js";
import { activate as activateStats } from "../../plugins/command-stats/src/index.js";
import {
  activate as activateDir,
  type DirPluginOptions,
} from "../../plugins/command-dir/src/index.js";
import { activate as activateBox } from "../../plugins/shape-box/src/index.js";
import { activate as activateDiamond } from "../../plugins/shape-diamond/src/index.js";
import { activate as activateTreeStar } from "../../plugins/tree-star/src/index.js";
import { activate as activateTreeBoxLabel } from "../../plugins/tree-box-label/src/index.js";

const HOST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HOST_DIR, "../..");

export interface CreateAppOptions {
  /**
   * `code`：组合根显式 activate（方式 A，默认）。
   * `config`：仅内置 + 从 plugins.config.json 加载（方式 B）。
   */
  assembly?: "code" | "config";
  /** 方式 B 的配置路径；默认仓库根 `plugins.config.json` */
  configPath?: string;
  /** 加载器/校验错误输出；默认 console.log */
  pluginLog?: (message: string) => void;
  /**
   * 方式 A 下是否启用可选插件。默认 true。
   * 单项可用 `plugins.*` 覆盖。方式 B 忽略此项（由配置决定）。
   */
  enableOptionalPlugins?: boolean;
  plugins?: {
    stats?: boolean;
    dir?: boolean;
    box?: boolean;
    diamond?: boolean;
    treeStar?: boolean;
    treeBoxLabel?: boolean;
  };
  /** 方式 A 下 diamond 插件 options（如默认 fill） */
  diamond?: { fill?: string };
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
  name: keyof NonNullable<CreateAppOptions["plugins"]>,
): boolean {
  const fallback = options.enableOptionalPlugins !== false;
  return options.plugins?.[name] ?? fallback;
}

function readPluginPackage(relDir: string): unknown {
  const pkgPath = path.join(REPO_ROOT, relDir, "package.json");
  return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
}

function activateCodePlugin(
  ctx: PluginContext,
  relDir: string,
  activate: (
    ctx: PluginContext,
    options?: Record<string, unknown>,
  ) => void,
  log: (m: string) => void,
  options?: Record<string, unknown>,
): void {
  const pkg = readPluginPackage(relDir);
  const name = (pkg as { name?: string }).name ?? relDir;
  const error = activatePluginValidated(ctx, {
    name,
    contributes: contributesFromPackageJson(pkg),
    activate,
    options,
  });
  if (error) {
    log(error);
  }
}

/**
 * 组合根：内置能力 + 方式 A 代码装配或方式 B 配置装配。
 * 可选插件均走 `activatePluginValidated`（同一注册/校验/回滚路径）。
 */
export function createApp(options: CreateAppOptions = {}): App {
  const log = options.pluginLog ?? console.log;
  const assembly = options.assembly ?? "code";

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

  if (assembly === "code") {
    registerOptionalPluginsCode(ctx, options, log);
  }

  const dispatcher = new CommandDispatcher(ctx.commands);
  return { ctx, document, history, session, dispatcher };
}

/** 方式 B：在 createApp 之后异步装入配置插件 */
export async function loadConfigPlugins(
  app: App,
  options: CreateAppOptions = {},
): Promise<void> {
  const log = options.pluginLog ?? console.log;
  const configPath =
    options.configPath ?? path.join(REPO_ROOT, "plugins.config.json");
  await loadPluginsFromConfig(app.ctx, configPath, log);
}

function registerOptionalPluginsCode(
  ctx: PluginContext,
  options: CreateAppOptions,
  log: (m: string) => void,
): void {
  if (pluginEnabled(options, "stats")) {
    activateCodePlugin(ctx, "plugins/command-stats", activateStats, log);
  }
  if (pluginEnabled(options, "dir")) {
    activateCodePlugin(
      ctx,
      "plugins/command-dir",
      (c, opts) => activateDir(c, { ...(options.dir ?? {}), ...(opts ?? {}) }),
      log,
    );
  }
  if (pluginEnabled(options, "box")) {
    activateCodePlugin(ctx, "plugins/shape-box", activateBox, log);
  }
  if (pluginEnabled(options, "diamond")) {
    activateCodePlugin(
      ctx,
      "plugins/shape-diamond",
      activateDiamond,
      log,
      options.diamond as Record<string, unknown> | undefined,
    );
  }
  if (pluginEnabled(options, "treeBoxLabel")) {
    activateCodePlugin(
      ctx,
      "plugins/tree-box-label",
      activateTreeBoxLabel,
      log,
    );
  }
  if (pluginEnabled(options, "treeStar")) {
    activateCodePlugin(ctx, "plugins/tree-star", activateTreeStar, log);
  }
}
