import type { CommandRegistry } from "../extensions/CommandRegistry.js";
import { tokenize } from "./tokenize.js";

/**
 * 按命令名分派到已注册的 ICliCommand。
 * 作业约定：按名字分派只允许出现在「命令分发」与「图形工厂/ShapeRegistry」两处。
 */
export class CommandDispatcher {
  constructor(private readonly commands: CommandRegistry) {}

  dispatch(line: string): string {
    const tokens = tokenize(line);
    if (tokens.length === 0) {
      return "";
    }

    const [name, ...args] = tokens;
    const command = this.commands.get(name);
    if (!command) {
      return `error: unknown command: ${name}`;
    }
    return command.execute(args);
  }
}
