import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { PluginContext } from "../extensions/PluginContext.js";
import {
  activatePluginValidated,
  type PluginModule,
} from "./activatePlugin.js";
import {
  contributesFromPackageJson,
  normalizeContributes,
} from "./pluginManifest.js";

const LOADER_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(LOADER_DIR, "../..");

export interface PluginConfigEntry {
  module: string;
  enabled?: boolean;
  options?: Record<string, unknown>;
}

export interface PluginsFile {
  plugins: PluginConfigEntry[];
}

export type PluginLog = (message: string) => void;

/**
 * 配置装配加载器（装配侧，不属于内核）。
 * 按字符串模块名动态 import，不硬编码具体插件包。
 */
export async function loadPluginsFromConfig(
  ctx: PluginContext,
  configPath: string,
  log: PluginLog = console.log,
): Promise<void> {
  const absoluteConfig = path.resolve(configPath);
  let parsed: unknown;
  try {
    const text = fs.readFileSync(absoluteConfig, "utf8");
    parsed = JSON.parse(text);
  } catch {
    log("error: invalid plugin config");
    return;
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as PluginsFile).plugins)
  ) {
    log("error: invalid plugin config");
    return;
  }

  const baseDir = path.dirname(absoluteConfig);
  const entries = (parsed as PluginsFile).plugins;

  for (const entry of entries) {
    if (!entry || typeof entry.module !== "string") {
      log("error: invalid plugin config");
      continue;
    }
    if (entry.enabled === false) {
      continue;
    }

    const moduleId = entry.module;
    let imported: PluginModule;
    let packageJson: unknown;
    try {
      const resolved = resolvePluginModule(moduleId, baseDir);
      imported = (await import(resolved.href)) as PluginModule;
      packageJson = readNearbyPackageJson(resolved.packageRoot);
    } catch (err) {
      if (isModuleNotFound(err)) {
        log(`error: plugin not found: ${moduleId}`);
      } else {
        const reason = err instanceof Error ? err.message : String(err);
        log(`error: plugin failed to activate: ${moduleId} (${reason})`);
      }
      continue;
    }

    const activate = resolveActivate(imported);
    if (!activate) {
      log(`error: plugin has no default export: ${moduleId}`);
      continue;
    }

    const name =
      (packageJson as { name?: string } | null)?.name ?? moduleId;
    const contributes = contributesFromPackageJson(packageJson ?? {});

    const error = activatePluginValidated(ctx, {
      name,
      contributes,
      activate,
      options: entry.options,
    });
    if (error) {
      log(error);
    }
  }
}

function resolveActivate(mod: PluginModule):
  | ((
      ctx: PluginContext,
      options?: Record<string, unknown>,
    ) => void | Promise<void>)
  | null {
  if (typeof mod.activate === "function") {
    return mod.activate;
  }
  if (typeof mod.default === "function") {
    return mod.default;
  }
  if (
    mod.default &&
    typeof mod.default === "object" &&
    typeof mod.default.activate === "function"
  ) {
    return mod.default.activate;
  }
  return null;
}

/**
 * 本地插件用相对本文件的 specifier 动态 import，与方式 A 静态 import 共享模块图，
 * 避免 file:// 绝对 URL 造成 Group 等类双实例（instanceof 失效 → tree 缩进不一致）。
 */
function resolvePluginModule(
  moduleId: string,
  baseDir: string,
): { href: string; packageRoot: string } {
  if (moduleId.startsWith(".") || path.isAbsolute(moduleId)) {
    const abs = path.resolve(baseDir, moduleId);
    if (!fs.existsSync(abs)) {
      throw Object.assign(new Error(`Cannot find module '${moduleId}'`), {
        code: "ERR_MODULE_NOT_FOUND",
      });
    }
    const entryTs = path.join(abs, "src", "index.ts");
    const entryJs = path.join(abs, "src", "index.js");
    const entry = fs.existsSync(entryTs)
      ? entryTs
      : fs.existsSync(entryJs)
        ? entryJs
        : abs;
    const realEntry = fs.realpathSync.native(entry);
    const realRepo = fs.realpathSync.native(REPO_ROOT);
    const underRepo =
      realEntry === realRepo ||
      realEntry.toLowerCase().startsWith(realRepo.toLowerCase() + path.sep);
    // 仓库内插件：相对 import 与方式 A 共享模块图；仓库外（测试夹具）：file URL
    if (underRepo) {
      let rel = path.relative(LOADER_DIR, realEntry).replace(/\\/g, "/");
      if (!rel.startsWith(".")) {
        rel = `./${rel}`;
      }
      return { href: rel, packageRoot: abs };
    }
    return { href: pathToFileURL(realEntry).href, packageRoot: abs };
  }

  try {
    const require = createRequire(path.join(baseDir, "package.json"));
    const pkgJson = require.resolve(`${moduleId}/package.json`);
    const root = path.dirname(pkgJson);
    return { href: moduleId, packageRoot: root };
  } catch (err) {
    throw Object.assign(
      err instanceof Error ? err : new Error(String(err)),
      { code: "ERR_MODULE_NOT_FOUND" },
    );
  }
}

function readNearbyPackageJson(packageRoot: string): unknown {
  const pkgPath = path.join(packageRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
}

function isModuleNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }
  const e = err as { code?: string; message?: string };
  return (
    e.code === "ERR_MODULE_NOT_FOUND" ||
    e.code === "MODULE_NOT_FOUND" ||
    /Cannot find module/i.test(e.message ?? "")
  );
}

/** 供测试：解析 contributes 而不加载 */
export function parseContributesForTest(raw: unknown) {
  return normalizeContributes(raw);
}
