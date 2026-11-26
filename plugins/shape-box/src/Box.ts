import { Group } from "../../../src/model/Group.js";
import { Rect } from "../../../src/model/Rect.js";
import { Text } from "../../../src/model/Text.js";

const DEFAULT_FILL = "#4a90d9";

/**
 * 复合图形 box：容器 + rect + text；序列化带 data-kind="box"。
 */
export class Box extends Group {
  private constructor(id: string) {
    super(id);
  }

  static create(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    fill: string = DEFAULT_FILL,
  ): Box {
    const box = new Box(id);
    box.addChild(new Rect(rectId(id), x, y, w, h, fill));
    box.addChild(new Text(labelId(id), x + 20, y + 35, label));
    return box;
  }

  /** 读回用空壳，子节点由 SvgReader 挂载后再 complete */
  static shell(id: string): Box {
    return new Box(id);
  }

  override getType(): string {
    return "box";
  }

  override canUngroup(): boolean {
    return false;
  }

  override treeLabel(): string {
    // `(box)` 标注由 TreeDecorator 插件提供（Exp-T0），此处与普通 g 行一致
    return `g#${this.id}`;
  }

  override formatCreated(containerId?: string): string | undefined {
    const base = `box#${this.id} created (g#${this.id} + rect#${rectId(this.id)} + text#${labelId(this.id)})`;
    if (containerId !== undefined) {
      return `${base} in g#${containerId}`;
    }
    return base;
  }

  override allowsChildRemoval(childId: string): boolean {
    return childId !== rectId(this.id) && childId !== labelId(this.id);
  }

  rect(): Rect {
    const child = this.getChildren().find((c) => c.getId() === rectId(this.id));
    if (!(child instanceof Rect)) {
      throw new Error(`error: box missing rect: ${rectId(this.id)}`);
    }
    return child;
  }

  labelNode(): Text {
    const child = this.getChildren().find((c) => c.getId() === labelId(this.id));
    if (!(child instanceof Text)) {
      throw new Error(`error: box missing label: ${labelId(this.id)}`);
    }
    return child;
  }

  override toShowLines(parentRef: string): string[] {
    return [
      `box#${this.id}  parent=${parentRef}`,
      `  children=${this.getChildren().length}`,
    ];
  }

  override toSvgLines(indent: string): string[] {
    const lines = [
      `${indent}<g${this.xmlAttr("id", this.id)} data-kind="box">`,
    ];
    const childIndent = `${indent}  `;
    for (const child of this.getChildren()) {
      lines.push(...child.toSvgLines(childIndent));
    }
    lines.push(`${indent}</g>`);
    return lines;
  }
}

export function rectId(boxId: string): string {
  return `${boxId}-rect`;
}

export function labelId(boxId: string): string {
  return `${boxId}-label`;
}
