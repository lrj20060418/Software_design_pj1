import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class ScaleCliCommand extends SessionCliCommand {
  readonly name = "scale";
  protected readonly help = [
    "  scale <id> <factor>                  scale geometry by factor"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.scale(args);
  }
}
