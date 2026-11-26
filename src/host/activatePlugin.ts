import type { PluginContext } from "../extensions/PluginContext.js";
import {
  formatManifestMismatch,
  sameNameSet,
  type PluginContributes,
  type RegisteredExtensions,
} from "./pluginManifest.js";

export { contributesFromPackageJson } from "./pluginManifest.js";

export interface PluginActivateFn {
  (
    ctx: PluginContext,
    options?: Record<string, unknown>,
  ): void | Promise<void>;
}

export interface PluginModule {
  activate?: PluginActivateFn;
  default?: PluginActivateFn | { activate?: PluginActivateFn };
}

/**
 * A/B 共用的注册与校验路径：activate → 比对 contributes → 失败则回滚本插件新增注册。
 */
export function activatePluginValidated(
  ctx: PluginContext,
  args: {
    name: string;
    contributes: PluginContributes;
    activate: PluginActivateFn;
    options?: Record<string, unknown>;
  },
): string | null {
  const before = snapshot(ctx);
  try {
    args.activate(ctx, args.options);
  } catch (err) {
    rollback(ctx, before);
    const reason = err instanceof Error ? err.message : String(err);
    return `error: plugin failed to activate: ${args.name} (${reason})`;
  }

  const after = snapshot(ctx);
  const registered = diff(before, after);
  const declared = args.contributes;

  if (
    !sameNameSet(declared.shapes, registered.shapes) ||
    !sameNameSet(declared.commands, registered.commands) ||
    !sameNameSet(declared.decorators, registered.decorators) ||
    !sameNameSet(declared.attributes, registered.attributes)
  ) {
    rollback(ctx, before);
    return formatManifestMismatch(args.name, declared, registered);
  }

  return null;
}

export function snapshot(ctx: PluginContext): RegisteredExtensions {
  return {
    shapes: ctx.shapes.types(),
    commands: ctx.commands.names(),
    decorators: ctx.treeDecorators.names(),
    attributes: ctx.attributes.names(),
  };
}

function diff(
  before: RegisteredExtensions,
  after: RegisteredExtensions,
): RegisteredExtensions {
  const sub = (a: string[], b: string[]): string[] =>
    b.filter((n) => !a.includes(n));
  return {
    shapes: sub(before.shapes, after.shapes),
    commands: sub(before.commands, after.commands),
    decorators: sub(before.decorators, after.decorators),
    attributes: sub(before.attributes, after.attributes),
  };
}

function rollback(ctx: PluginContext, before: RegisteredExtensions): void {
  const after = snapshot(ctx);
  const added = diff(before, after);
  for (const name of added.shapes) {
    ctx.shapes.unregister(name);
  }
  for (const name of added.commands) {
    ctx.commands.unregister(name);
  }
  for (const name of added.decorators) {
    ctx.treeDecorators.unregister(name);
  }
  for (const name of added.attributes) {
    ctx.attributes.unregister(name);
  }
}

