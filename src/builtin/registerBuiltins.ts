import type { PluginContext } from "../extensions/PluginContext.js";
import type { EditorSession } from "../host/EditorSession.js";
import { RectShapeProvider } from "./shapes/RectShapeProvider.js";
import { CircleShapeProvider } from "./shapes/CircleShapeProvider.js";
import { EllipseShapeProvider } from "./shapes/EllipseShapeProvider.js";
import { LineShapeProvider } from "./shapes/LineShapeProvider.js";
import { TextShapeProvider } from "./shapes/TextShapeProvider.js";
import { GroupShapeProvider } from "./shapes/GroupShapeProvider.js";
import { InitCliCommand } from "./commands/InitCliCommand.js";
import { CreateCliCommand } from "./commands/CreateCliCommand.js";
import { MoveCliCommand } from "./commands/MoveCliCommand.js";
import { SetCliCommand } from "./commands/SetCliCommand.js";
import { DeleteCliCommand } from "./commands/DeleteCliCommand.js";
import { GroupCliCommand } from "./commands/GroupCliCommand.js";
import { UngroupCliCommand } from "./commands/UngroupCliCommand.js";
import { AddToCliCommand } from "./commands/AddToCliCommand.js";
import { FrontCliCommand } from "./commands/FrontCliCommand.js";
import { BackCliCommand } from "./commands/BackCliCommand.js";
import { ScaleCliCommand } from "./commands/ScaleCliCommand.js";
import { CanvasCliCommand } from "./commands/CanvasCliCommand.js";
import { SaveCliCommand } from "./commands/SaveCliCommand.js";
import { ReadCliCommand } from "./commands/ReadCliCommand.js";
import { ExportCliCommand } from "./commands/ExportCliCommand.js";
import { UndoCliCommand } from "./commands/UndoCliCommand.js";
import { RedoCliCommand } from "./commands/RedoCliCommand.js";
import { TreeCliCommand } from "./commands/TreeCliCommand.js";
import { ShowCliCommand } from "./commands/ShowCliCommand.js";
import { HelpCliCommand } from "./commands/HelpCliCommand.js";

/** 默认装配：六种图形 + Phase 1 全部内置命令（无可选插件） */
export function registerBuiltinShapes(ctx: PluginContext): void {
  ctx.shapes.register(new RectShapeProvider());
  ctx.shapes.register(new CircleShapeProvider());
  ctx.shapes.register(new EllipseShapeProvider());
  ctx.shapes.register(new LineShapeProvider());
  ctx.shapes.register(new TextShapeProvider());
  ctx.shapes.register(new GroupShapeProvider());
}

export function registerBuiltinCommands(
  ctx: PluginContext,
  session: EditorSession,
): void {
  // 顺序影响 help 输出，与 Phase 1 文案顺序对齐
  const commands = [
    new InitCliCommand(session),
    new CreateCliCommand(session),
    new MoveCliCommand(session),
    new SetCliCommand(session),
    new DeleteCliCommand(session),
    new GroupCliCommand(session),
    new UngroupCliCommand(session),
    new AddToCliCommand(session),
    new FrontCliCommand(session),
    new BackCliCommand(session),
    new ScaleCliCommand(session),
    new CanvasCliCommand(session),
    new SaveCliCommand(session),
    new ReadCliCommand(session),
    new ExportCliCommand(session),
    new UndoCliCommand(session),
    new RedoCliCommand(session),
    new TreeCliCommand(session),
    new ShowCliCommand(session),
    new HelpCliCommand(session),
  ];
  for (const command of commands) {
    ctx.commands.register(command);
  }
}
