import { Document } from "../model/Document.js";
import { History } from "../history/History.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { CreateCommand } from "../commands/CreateCommand.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { SetCommand } from "../commands/SetCommand.js";
import { DeleteCommand } from "../commands/DeleteCommand.js";
import { GroupCommand } from "../commands/GroupCommand.js";
import { UngroupCommand } from "../commands/UngroupCommand.js";
import { AddToCommand } from "../commands/AddToCommand.js";
import { FrontCommand } from "../commands/FrontCommand.js";
import { BackCommand } from "../commands/BackCommand.js";
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
      case "move":
        return this.move(args);
      case "set":
        return this.set(args);
      case "delete":
        return this.delete(args);
      case "group":
        return this.group(args);
      case "ungroup":
        return this.ungroup(args);
      case "addto":
        return this.addto(args);
      case "front":
        return this.front(args);
      case "back":
        return this.back(args);
      case "undo":
        return this.undo(args);
      case "redo":
        return this.redo(args);
      default:
        return `error: unknown command: ${name}`;
    }
  }

  private help(): string {
    return [
      "Commands:",
      "  init [w] [h]                         create empty canvas (default 800x600)",
      "  create <type> <id> [params…] [in <g>]  create shape (rect/circle/ellipse/line/text/g)",
      "  move <id> <dx> <dy>                  translate shape",
      "  set <id> <attr> <value>              set attribute",
      "  delete <id>                         delete shape (and descendants)",
      "  group <gid> <id1> <id2>…             create g and adopt shapes",
      "  ungroup <gid>                       dissolve nested g",
      "  addto <gid> <id>                    move shape into g",
      "  front <id> / back <id>              z-order among siblings",
      "  undo / redo                         undo or redo last edit",
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

  private move(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 3) {
      return "error: usage: move <id> <dx> <dy>";
    }

    const id = args[0];
    const dx = Number(args[1]);
    const dy = Number(args[2]);
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      return "error: usage: move <id> <dx> <dy>";
    }

    const shape = this.document.requireShape(id);
    return this.history.execute(new MoveCommand(shape, dx, dy));
  }

  private set(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 3) {
      return "error: usage: set <id> <attr> <value>";
    }

    const [id, attr, value] = args;
    const shape = this.document.requireShape(id);

    try {
      const command = new SetCommand(shape, attr, value);
      return this.history.execute(command);
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  private delete(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: delete <id>";
    }

    const id = args[0];
    this.document.requireShape(id);
    return this.history.execute(new DeleteCommand(this.document, id));
  }

  private group(args: string[]): string {
    this.document.ensureReady();
    if (args.length < 2) {
      return "error: usage: group <newGid> <id1> <id2>…";
    }

    const newGid = args[0];
    const memberIds = args.slice(1);

    if (this.document.hasId(newGid)) {
      return `error: id already exists: ${newGid}`;
    }

    for (const id of memberIds) {
      this.document.requireShape(id);
    }

    for (let i = 0; i < memberIds.length; i++) {
      for (let j = 0; j < memberIds.length; j++) {
        if (i === j) {
          continue;
        }
        if (this.document.isAncestorOf(memberIds[i], memberIds[j])) {
          return `error: cannot group a container into its own descendant: ${memberIds[i]}`;
        }
      }
    }

    return this.history.execute(
      new GroupCommand(this.document, newGid, memberIds),
    );
  }

  private ungroup(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: ungroup <gid>";
    }

    try {
      return this.history.execute(new UngroupCommand(this.document, args[0]));
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  private addto(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 2) {
      return "error: usage: addto <gid> <id>";
    }

    try {
      return this.history.execute(
        new AddToCommand(this.document, args[0], args[1]),
      );
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  private front(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: front <id>";
    }
    return this.history.execute(new FrontCommand(this.document, args[0]));
  }

  private back(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: back <id>";
    }
    return this.history.execute(new BackCommand(this.document, args[0]));
  }

  private undo(args: string[]): string {
    if (args.length !== 0) {
      return "error: usage: undo";
    }
    return this.history.undo();
  }

  private redo(args: string[]): string {
    if (args.length !== 0) {
      return "error: usage: redo";
    }
    return this.history.redo();
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
