import type { ICliCommand } from "../../../src/extensions/ICliCommand.js";
import type { IDirectoryAccess } from "./IDirectoryAccess.js";
import { formatDirListing } from "./formatDirListing.js";

/**
 * 命令插件：dir — 列出 CWD 直接子项；不依赖 Document；不进 undo。
 */
export class DirCliCommand implements ICliCommand {
  readonly name = "dir";

  constructor(
    private readonly directoryAccess: IDirectoryAccess,
    /** 启动时固定的工作目录，read/save 不得改变它 */
    private readonly cwd: string,
  ) {}

  helpLines(): string[] {
    return ["  dir                                  list files in working directory"];
  }

  execute(args: string[]): string {
    if (args.length !== 0) {
      return "error: usage: dir";
    }
    try {
      const entries = this.directoryAccess.list(this.cwd);
      return formatDirListing(entries);
    } catch {
      return `error: cannot read directory: ${this.cwd}`;
    }
  }
}
