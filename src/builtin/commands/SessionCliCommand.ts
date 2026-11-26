import type { ICliCommand } from "../../extensions/ICliCommand.js";
import type { EditorSession } from "../../host/EditorSession.js";

/**
 * 绑定到 EditorSession 方法的内置 CLI 命令基类。
 * 每个具体命令一类一文件，仅声明 name / help / 调用的会话方法。
 */
export abstract class SessionCliCommand implements ICliCommand {
  abstract readonly name: string;
  protected abstract readonly help: string[];

  constructor(protected readonly session: EditorSession) {}

  helpLines(): string[] {
    return this.help;
  }

  abstract execute(args: string[]): string;
}
