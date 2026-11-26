import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class HelpCliCommand extends SessionCliCommand {
  readonly name = "help";
  protected readonly help = [
    "  help                                 show this help"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.help();
  }
}
