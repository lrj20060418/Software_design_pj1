import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class AddToCliCommand extends SessionCliCommand {
  readonly name = "addto";
  protected readonly help = [
    "  addto <gid> <id>                    move shape into g"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.addto(args);
  }
}
