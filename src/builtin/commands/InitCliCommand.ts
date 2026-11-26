import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class InitCliCommand extends SessionCliCommand {
  readonly name = "init";
  protected readonly help = [
    "  init [w] [h]                         create empty canvas (default 800x600)"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.init(args);
  }
}
