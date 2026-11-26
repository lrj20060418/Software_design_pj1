import type { ICliCommand } from "../../../src/extensions/ICliCommand.js";
import type { Document } from "../../../src/model/Document.js";
import { collectStats, formatStats } from "./collectStats.js";

/**
 * 命令插件：stats — 统计叶子类型与容器数；不进入 undo 栈。
 */
export class StatsCliCommand implements ICliCommand {
  readonly name = "stats";

  constructor(private readonly document: Document) {}

  helpLines(): string[] {
    return ["  stats                                count shapes by type"];
  }

  execute(args: string[]): string {
    if (args.length !== 0) {
      return "error: usage: stats";
    }
    this.document.ensureReady();
    return formatStats(collectStats(this.document.getRoots()));
  }
}
