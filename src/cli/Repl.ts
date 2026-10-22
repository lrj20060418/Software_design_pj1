import * as readline from "node:readline";
import { Document } from "../model/Document.js";
import { History } from "../history/History.js";
import { CommandDispatcher } from "./CommandDispatcher.js";

/**
 * CLI 入口：维护提示符、读行、注释跳过，把一行交给 CommandDispatcher。
 * 本模块只做 IO，不直接改图形树。
 */
export class Repl {
  private readonly document = new Document();
  private readonly history = new History();
  private readonly dispatcher: CommandDispatcher;

  constructor() {
    this.dispatcher = new CommandDispatcher(this.document, this.history);
  }

  start(): void {
    console.log("svg-editor 0.1 — type 'help' for commands");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "svg> ",
    });

    rl.prompt();

    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        rl.prompt();
        return;
      }

      try {
        const output = this.dispatcher.dispatch(trimmed);
        if (output.length > 0) {
          console.log(output);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(message.startsWith("error:") ? message : `error: ${message}`);
      }

      rl.prompt();
    });

    rl.on("close", () => {
      process.exit(0);
    });
  }
}
