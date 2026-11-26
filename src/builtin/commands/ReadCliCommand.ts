import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class ReadCliCommand extends SessionCliCommand {
  readonly name = "read";
  protected readonly help = [
    "  read <file.svg>                     load document from svg"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.read(args);
  }
}
