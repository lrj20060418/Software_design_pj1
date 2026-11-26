import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class BackCliCommand extends SessionCliCommand {
  readonly name = "back";
  protected readonly help = [

  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.back(args);
  }
}
