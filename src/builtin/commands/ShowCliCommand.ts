import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class ShowCliCommand extends SessionCliCommand {
  readonly name = "show";
  protected readonly help = [
    "  show <id>                            show shape attributes"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.show(args);
  }
}
