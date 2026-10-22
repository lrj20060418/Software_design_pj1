/**
 * Command 模式接口：一条可撤销编辑 = 一个 ICommand。
 * History 只依赖本接口，不关心具体命令。
 */
export interface ICommand {
  execute(): string;
  undo(): string;
}
