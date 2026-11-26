import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class GroupCliCommand extends SessionCliCommand {
  readonly name = "group";
  protected readonly help = [
    "  group <gid> <id1> <id2>…             create g and adopt shapes"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.group(args);
  }
}
