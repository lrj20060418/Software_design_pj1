/**
 * 图形基类（Composite 叶子/容器的共同接口）。
 * move / scale / set 等对 Group 与叶子一视同仁。
 */
export abstract class Shape {
  constructor(protected readonly id: string) {}

  getId(): string {
    return this.id;
  }

  abstract getType(): string;

  /** 叶子锚点，供 move 成功回显 `moved to (x,y)` */
  abstract describePosition(): string;

  abstract move(dx: number, dy: number): void;

  abstract scale(factor: number): void;

  /** 白名单外抛 `error: unknown attribute`；`undefined` 表示清除可选属性 */
  abstract setAttribute(attr: string, value: string | undefined): void;

  abstract getAttribute(attr: string): string | undefined;

  abstract toTreeLine(indent: string, isLast: boolean): string[];

  abstract toShowLines(parentRef: string): string[];
}
