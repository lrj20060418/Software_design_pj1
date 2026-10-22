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

  abstract move(dx: number, dy: number): void;

  abstract scale(factor: number): void;

  abstract setAttribute(attr: string, value: string): void;

  abstract toTreeLine(indent: string, isLast: boolean): string[];

  abstract toShowLines(parentRef: string): string[];
}
