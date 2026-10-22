import type { ICommand } from "../commands/ICommand.js";

/**
 * undo / redo 栈。
 * IO 类命令（init/read/save/canvas 改尺寸）执行后禁止 undo，
 * 直到下一次编辑命令重新解禁。
 */
export class History {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private ioLocked = false;

  execute(command: ICommand): string {
    const result = command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this.ioLocked = false;
    return result;
  }

  /** init / read / save / canvas 修改后调用 */
  clearAfterIo(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.ioLocked = true;
  }

  undo(): string {
    if (this.ioLocked) {
      throw new Error("error: undo not allowed after io command");
    }
    const command = this.undoStack.pop();
    if (!command) {
      throw new Error("error: nothing to undo");
    }
    const result = command.undo();
    this.redoStack.push(command);
    return result;
  }

  redo(): string {
    if (this.ioLocked) {
      throw new Error("error: undo not allowed after io command");
    }
    const command = this.redoStack.pop();
    if (!command) {
      throw new Error("error: nothing to redo");
    }
    const result = command.execute();
    this.undoStack.push(command);
    return result;
  }
}
