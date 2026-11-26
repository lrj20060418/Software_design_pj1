import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class DeleteCliCommand extends SessionCliCommand {
  readonly name = "delete";
  protected readonly help = [
    "  delete <id>                         delete shape (and descendants)"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.delete(args);
  }
}
