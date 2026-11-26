import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class RedoCliCommand extends SessionCliCommand {
  readonly name = "redo";
  protected readonly help = [

  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.redo(args);
  }
}
