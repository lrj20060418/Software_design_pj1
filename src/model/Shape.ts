/**
 * 图形基类（Composite 叶子/容器的共同接口）。
 * move / scale / set 等对 Group 与叶子一视同仁。
 */
export abstract class Shape {
  constructor(protected readonly id: string) {}

  getId(): string {
    return this.id;
  }

  protected xmlAttr(name: string, value: string | number | undefined): string {
    if (value === undefined) {
      return "";
    }
    return ` ${name}="${escapeXml(String(value))}"`;
  }

  abstract getType(): string;

  /** 叶子锚点，供 move 成功回显 `moved to (x,y)` */
  abstract describePosition(): string;

  abstract move(dx: number, dy: number): void;

  abstract scale(factor: number): void;

  /** 白名单外抛 `error: unknown attribute`；`undefined` 表示清除可选属性 */
  abstract setAttribute(attr: string, value: string | undefined): void;

  abstract getAttribute(attr: string): string | undefined;

  /**
   * 是否允许 ungroup。普通 g 为 true；复合类型（如未来 box）覆写为 false。
   */
  canUngroup(): boolean {
    return false;
  }

  abstract toTreeLine(indent: string, isLast: boolean): string[];

  abstract toShowLines(parentRef: string): string[];

  /** 序列化为 SVG 片段（含缩进）；供 SvgWriter 使用 */
  abstract toSvgLines(indent: string): string[];
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
