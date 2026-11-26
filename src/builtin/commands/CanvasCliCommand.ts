import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class CanvasCliCommand extends SessionCliCommand {
  readonly name = "canvas";
  protected readonly help = [
    "  canvas [w] [h]                      show or resize canvas"
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return this.session.canvas(args);
  }
}
