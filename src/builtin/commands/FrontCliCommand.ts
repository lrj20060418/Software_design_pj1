import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class FrontCliCommand extends SessionCliCommand {
  readonly name = "front";
  protected readonly help = [
    "  front <id> / back <id>              z-order among siblings"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.front(args);
  }
}
