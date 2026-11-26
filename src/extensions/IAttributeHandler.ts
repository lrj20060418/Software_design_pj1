/**
 * 扩展点：对某图形设置某属性时的领域语义。
 * 初始契约见 phase_cli_2 §3.3；后续 Exp 可完善事务/冲突规则。
 */
export interface IAttributeHandler {
  /** 稳定注册名，如 `box-fill` */
  readonly name: string;

  /** 判断是否负责该图形及属性；不得修改文档 */
  handles(shapeId: string, attr: string): boolean;

  /** 执行该属性对应的修改 */
  apply(shapeId: string, attr: string, value: string): void;
}
