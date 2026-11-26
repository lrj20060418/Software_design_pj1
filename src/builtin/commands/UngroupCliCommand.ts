import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class UngroupCliCommand extends SessionCliCommand {
  readonly name = "ungroup";
  protected readonly help = [
    "  ungroup <gid>                       dissolve nested g"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.ungroup(args);
  }
}
