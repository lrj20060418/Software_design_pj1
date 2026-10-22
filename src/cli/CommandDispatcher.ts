import { Document } from "../model/Document.js";
import { History } from "../history/History.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { CreateCommand } from "../commands/CreateCommand.js";
import { tokenize } from "./tokenize.js";

/**
 * 按命令名分派到具体处理逻辑。
 * 作业约定：按名字分派只允许出现在「命令分发」与「图形工厂」两处；
 * 本类是第一处，架构方案中标注为待重构点。
 */
export class CommandDispatcher {
  constructor(
    private readonly document: Document,
    private readonly history: History,
  ) {}

  dispatch(line: string): string {
    const tokens = tokenize(line);
    if (tokens.length === 0) {
      return "";
    }

    const [name, ...args] = tokens;

    switch (name) {
      case "help":
        return this.help();
      case "init":
        return this.init(args);
      case "create":
        return this.create(args);
      case "tree":
        return this.tree(args);
      case "show":
        return this.show(args);
      default:
        return `error: unknown command: ${name}`;
    }
  }

  private help(): string {
    return [
      "Commands:",
      "  init [w] [h]                         create empty canvas (default 800x600)",
      "  create <type> <id> [params…] [in <g>]  create shape (rect/circle/ellipse/line/text/g)",
      "  tree [id]                            show structure tree",
      "  show <id>                            show shape attributes",
      "  help                                 show this help",
    ].join("\n");
  }

  private init(args: string[]): string {
    const width = args[0] !== undefined ? Number(args[0]) : 800;
    const height = args[1] !== undefined ? Number(args[1]) : 600;

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return "error: invalid canvas size";
    }

    this.document.init(width, height);
    this.history.clearAfterIo();
    return `canvas ${width}x${height} created`;
  }

  private create(args: string[]): string {
    this.document.ensureReady();

    if (args.length < 2) {
      return "error: usage: create <type> <id> [params…] [in <containerId>]";
    }

    const type = args[0];
    const id = args[1];
    const { params, containerId } = peelInClause(args.slice(2));

    if (this.document.hasId(id)) {
      return `error: id already exists: ${id}`;
    }

    // 先解析父容器，失败则不创建对象（零副作用）
    if (containerId !== undefined) {
      const container = this.document.getShape(containerId);
      if (!container) {
        return `error: no such container: ${containerId}`;
      }
      if (container.getType() !== "g") {
        return `error: not a container: ${containerId}`;
      }
    }

    let shape;
    try {
      shape = ShapeFactory.create(type, id, params);
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }

    const command = new CreateCommand(this.document, shape, containerId);
    return this.history.execute(command);
  }

  private tree(args: string[]): string {
    this.document.ensureReady();
    if (args.length > 1) {
      return "error: usage: tree [id]";
    }
    return this.document.renderTree(args[0]);
  }

  private show(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: show <id>";
    }
    return this.document.renderShow(args[0]);
  }
}

/** 解析尾缀 `in <containerId>` */
function peelInClause(args: string[]): {
  params: string[];
  containerId: string | undefined;
} {
  if (args.length >= 2 && args[args.length - 2] === "in") {
    return {
      params: args.slice(0, -2),
      containerId: args[args.length - 1],
    };
  }
  return { params: args, containerId: undefined };
}
