import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class TreeCliCommand extends SessionCliCommand {
  readonly name = "tree";
  protected readonly help = [
    "  tree [id]                            show structure tree"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.tree(args);
  }
}
