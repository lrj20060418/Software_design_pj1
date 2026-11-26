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
import { ScaleCommand } from "../commands/ScaleCommand.js";
import { SvgReader } from "../io/SvgReader.js";
import { SvgWriter } from "../io/SvgWriter.js";
import type { AttributeHandlerRegistry } from "../extensions/AttributeHandlerRegistry.js";
import type { CommandRegistry } from "../extensions/CommandRegistry.js";
import type { TreeDecoratorRegistry } from "../extensions/TreeDecoratorRegistry.js";
import { AttributeHandlerCommand } from "../commands/AttributeHandlerCommand.js";

/**
 * 内置命令的共享会话能力（文档 / 历史 / 工厂 / IO / 扩展注册表）。
 * CLI 命令类调用本会话；不在此按命令名 switch。
 */
export class EditorSession {
  readonly reader: SvgReader;
  readonly writer = new SvgWriter();

  constructor(
    readonly document: Document,
    readonly history: History,
    readonly shapeFactory: ShapeFactory,
    readonly commands: CommandRegistry,
    readonly treeDecorators: TreeDecoratorRegistry,
    readonly attributes: AttributeHandlerRegistry,
  ) {
    this.reader = new SvgReader(shapeFactory);
  }

  help(): string {
    const lines = ["Commands:"];
    for (const command of this.commands.list()) {
      lines.push(...command.helpLines());
    }
    return lines.join("\n");
  }

  init(args: string[]): string {
    const width = args[0] !== undefined ? Number(args[0]) : 800;
    const height = args[1] !== undefined ? Number(args[1]) : 600;

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return "error: invalid canvas size";
    }

    this.document.init(width, height);
    this.history.clearAfterIo();
    this.notifyTreeDecoratorsReset();
    return `canvas ${width}x${height} created`;
  }

  read(args: string[]): string {
    if (args.length !== 1) {
      return "error: usage: read <file.svg>";
    }
    const filePath = args[0];
    try {
      const warnings = this.reader.read(filePath, this.document);
      this.history.clearAfterIo();
      this.notifyTreeDecoratorsReset();
      const count = this.document.elementCount();
      const lines = [...warnings, `read ${filePath} (${count} elements)`];
      return lines.join("\n");
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  save(args: string[]): string {
    this.document.ensureReady();
    if (args.length > 1) {
      return "error: usage: save [file.svg]";
    }

    const filePath = args[0] ?? this.document.getSourcePath();
    if (!filePath) {
      return "error: usage: save [file.svg]";
    }

    try {
      const count = this.writer.write(this.document, filePath);
      this.document.setSourcePath(filePath);
      this.history.clearAfterIo();
      this.notifyTreeDecoratorsSave();
      return `saved to ${filePath} (${count} elements)`;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  private notifyTreeDecoratorsReset(): void {
    for (const decorator of this.treeDecorators.list()) {
      decorator.onAfterReset?.(this.document);
    }
  }

  private notifyTreeDecoratorsSave(): void {
    for (const decorator of this.treeDecorators.list()) {
      decorator.onAfterSave?.(this.document);
    }
  }

  create(args: string[]): string {
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

    if (containerId !== undefined) {
      const container = this.document.getShape(containerId);
      if (!container) {
        return `error: no such container: ${containerId}`;
      }
      if (!container.isContainer()) {
        return `error: not a container: ${containerId}`;
      }
    }

    let shape;
    try {
      shape = this.shapeFactory.create(type, id, params);
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }

    try {
      return this.history.execute(
        new CreateCommand(this.document, shape, containerId),
      );
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  move(args: string[]): string {
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

  set(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 3) {
      return "error: usage: set <id> <attr> <value>";
    }

    const [id, attr, value] = args;
    this.document.requireShape(id);

    const handlers = this.attributes.findHandlers(id, attr, this.document);
    if (handlers.length > 1) {
      // ADR-0001：多处理器同时命中 → 拒绝，不执行、不入栈
      return `error: conflicting attribute handlers for ${attr} on ${id}`;
    }
    if (handlers.length === 1) {
      try {
        const ctx = {
          document: this.document,
          shapeId: id,
          attr,
          value,
        };
        const command = new AttributeHandlerCommand(handlers[0], ctx);
        return this.history.execute(command);
      } catch (err) {
        // apply 失败已在 Command 内回滚；此处保证不回落默认 SetCommand
        const message = err instanceof Error ? err.message : String(err);
        return message.startsWith("error:") ? message : `error: ${message}`;
      }
    }

    // 无处理器：Phase 1 原有白名单规则
    try {
      const shape = this.document.requireShape(id);
      return this.history.execute(new SetCommand(shape, attr, value));
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  delete(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: delete <id>";
    }
    const id = args[0];
    this.document.requireShape(id);
    try {
      return this.history.execute(new DeleteCommand(this.document, id));
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  group(args: string[]): string {
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

  ungroup(args: string[]): string {
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

  addto(args: string[]): string {
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

  front(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: front <id>";
    }
    return this.history.execute(new FrontCommand(this.document, args[0]));
  }

  back(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: back <id>";
    }
    return this.history.execute(new BackCommand(this.document, args[0]));
  }

  scale(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 2) {
      return "error: usage: scale <id> <factor>";
    }

    const id = args[0];
    const factor = Number(args[1]);
    if (!Number.isFinite(factor)) {
      return "error: usage: scale <id> <factor>";
    }
    if (factor <= 0) {
      return "error: scale factor must be positive";
    }

    const shape = this.document.requireShape(id);
    return this.history.execute(new ScaleCommand(shape, factor));
  }

  canvas(args: string[]): string {
    this.document.ensureReady();

    if (args.length === 0) {
      return `canvas ${this.document.getWidth()}x${this.document.getHeight()}`;
    }

    if (args.length !== 2) {
      return "error: usage: canvas [w] [h]";
    }

    const width = Number(args[0]);
    const height = Number(args[1]);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return "error: invalid canvas size";
    }

    this.document.setSize(width, height);
    this.history.clearAfterIo();
    return `canvas ${width}x${height}`;
  }

  undo(args: string[]): string {
    if (args.length !== 0) {
      return "error: usage: undo";
    }
    return this.history.undo();
  }

  redo(args: string[]): string {
    if (args.length !== 0) {
      return "error: usage: redo";
    }
    return this.history.redo();
  }

  tree(args: string[]): string {
    this.document.ensureReady();
    if (args.length > 1) {
      return "error: usage: tree [id]";
    }
    const hook = this.treeDecorators.createLineHook(this.document);
    return this.document.renderTree(args[0], hook);
  }

  show(args: string[]): string {
    this.document.ensureReady();
    if (args.length !== 1) {
      return "error: usage: show <id>";
    }
    return this.document.renderShow(args[0]);
  }
}

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
