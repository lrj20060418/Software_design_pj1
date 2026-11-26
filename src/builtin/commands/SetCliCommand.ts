import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class SetCliCommand extends SessionCliCommand {
  readonly name = "set";
  protected readonly help = [
    "  set <id> <attr> <value>              set attribute"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.set(args);
  }
}
