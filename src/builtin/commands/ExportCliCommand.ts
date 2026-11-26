import type { ICliCommand } from "../../extensions/ICliCommand.js";
import type { EditorSession } from "../../host/EditorSession.js";

/**
 * 内置分派：`export <format> <path>` → ExporterRegistry。
 * 无插件时任意 format 均为 unknown export format。
 */
export class ExportCliCommand implements ICliCommand {
  readonly name = "export";

  constructor(private readonly session: EditorSession) {}

  helpLines(): string[] {
    return [
      '  export <format> <path>               export document (plugin formats)',
    ];
  }

  execute(args: string[]): string {
    return this.session.exportDocument(args);
  }
}
