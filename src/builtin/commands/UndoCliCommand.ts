import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class UndoCliCommand extends SessionCliCommand {
  readonly name = "undo";
  protected readonly help = [
    "  undo / redo                         undo or redo last edit"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.undo(args);
  }
}
