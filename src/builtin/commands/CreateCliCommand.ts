import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class CreateCliCommand extends SessionCliCommand {
  readonly name = "create";
  protected readonly help = [
    "  create <type> <id> [params…] [in <g>]  create shape (rect/circle/ellipse/line/text/g)"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.create(args);
  }
}
