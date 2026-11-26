import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class SaveCliCommand extends SessionCliCommand {
  readonly name = "save";
  protected readonly help = [
    "  save [file.svg]                     save document to svg"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.save(args);
  }
}
