/**
 * 扩展点：一条可被 REPL 分发的命令（含内置与插件命令）。
 * 与可撤销的 `ICommand`（history）不同：本接口面向「按名分派」。
 */
export interface ICliCommand {
  /** 命令名，如 `create`、`stats` */
  readonly name: string;

  /** 写入 `help` 的一行或多行文案（已含缩进） */
  helpLines(): string[];

  /** 执行命令；返回用户可见输出（可多行）；失败返回 `error: …` 或抛错由 REPL 捕获 */
  execute(args: string[]): string;
}
