import type { ICliCommand } from "./ICliCommand.js";

export class CommandRegistry {
  private readonly commands = new Map<string, ICliCommand>();

  register(command: ICliCommand): void {
    const key = command.name;
    if (this.commands.has(key)) {
      throw new Error(`error: duplicate registration: commands/${key}`);
    }
    this.commands.set(key, command);
  }

  get(name: string): ICliCommand | undefined {
    return this.commands.get(name);
  }

  list(): ICliCommand[] {
    return [...this.commands.values()];
  }

  names(): string[] {
    return [...this.commands.keys()];
  }
}
