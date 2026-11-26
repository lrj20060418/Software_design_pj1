import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class MoveCliCommand extends SessionCliCommand {
  readonly name = "move";
  protected readonly help = [
    "  move <id> <dx> <dy>                  translate shape"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.move(args);
  }
}
