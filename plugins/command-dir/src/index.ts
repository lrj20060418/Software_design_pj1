import type { PluginContext } from "../../../src/extensions/PluginContext.js";
import { DirCliCommand } from "./DirCliCommand.js";
import type { IDirectoryAccess } from "./IDirectoryAccess.js";
import { NodeFsDirectoryAccess } from "./NodeFsDirectoryAccess.js";

export type { IDirectoryAccess, DirectoryEntry } from "./IDirectoryAccess.js";
export { NodeFsDirectoryAccess } from "./NodeFsDirectoryAccess.js";
export { FakeDirectoryAccess } from "./FakeDirectoryAccess.js";
export { formatDirListing } from "./formatDirListing.js";
export { DirCliCommand } from "./DirCliCommand.js";

export interface DirPluginOptions {
  /** 默认 `process.cwd()`；测试可注入固定路径 */
  cwd?: string;
  /** 默认真实 Node fs 适配器；测试可注入 FakeDirectoryAccess */
  directoryAccess?: IDirectoryAccess;
}

/**
 * @svgframe/plugin-command-dir
 * 通过扩展点注册 `dir`；可单独启用/禁用。
 */
export function activate(
  ctx: PluginContext,
  options: DirPluginOptions = {},
): void {
  const cwd = options.cwd ?? process.cwd();
  const access = options.directoryAccess ?? new NodeFsDirectoryAccess();
  ctx.commands.register(new DirCliCommand(access, cwd));
}

export default { activate };
