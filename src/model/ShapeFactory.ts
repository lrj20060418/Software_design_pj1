import { Shape } from "./Shape.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { Text } from "./Text.js";
import { Group } from "./Group.js";

/**
 * 按类型名创建图形 —— 作业允许的「按名字分派」第二处（待重构）。
 */
export class ShapeFactory {
  static create(type: string, id: string, params: string[]): Shape {
    switch (type) {
      case "rect":
        return ShapeFactory.createRect(id, params);
      case "circle":
        return ShapeFactory.createCircle(id, params);
      case "ellipse":
        return ShapeFactory.createEllipse(id, params);
      case "line":
        return ShapeFactory.createLine(id, params);
      case "text":
        return ShapeFactory.createText(id, params);
      case "g":
        return ShapeFactory.createGroup(id, params);
      default:
        throw new Error(
          `error: unknown shape type: ${type} (is the plugin loaded?)`,
        );
    }
  }

  private static createRect(id: string, params: string[]): Rect {
    if (params.length < 4 || params.length > 5) {
      throw new Error(
        "error: usage: create rect <id> <x> <y> <w> <h> [fill]",
      );
    }
    const [x, y, w, h] = ShapeFactory.requireNumbers(params.slice(0, 4));
    const fill = params[4];
    return new Rect(id, x, y, w, h, fill);
  }

  private static createCircle(id: string, params: string[]): Circle {
    if (params.length < 3 || params.length > 4) {
      throw new Error(
        "error: usage: create circle <id> <cx> <cy> <r> [fill]",
      );
    }
    const [cx, cy, r] = ShapeFactory.requireNumbers(params.slice(0, 3));
    const fill = params[3];
    return new Circle(id, cx, cy, r, fill);
  }

  private static createEllipse(id: string, params: string[]): Ellipse {
    if (params.length < 4 || params.length > 5) {
      throw new Error(
        "error: usage: create ellipse <id> <cx> <cy> <rx> <ry> [fill]",
      );
    }
    const [cx, cy, rx, ry] = ShapeFactory.requireNumbers(params.slice(0, 4));
    const fill = params[4];
    return new Ellipse(id, cx, cy, rx, ry, fill);
  }

  private static createLine(id: string, params: string[]): Line {
    if (params.length < 4 || params.length > 5) {
      throw new Error(
        "error: usage: create line <id> <x1> <y1> <x2> <y2> [stroke]",
      );
    }
    const [x1, y1, x2, y2] = ShapeFactory.requireNumbers(params.slice(0, 4));
    const stroke = params[4];
    return new Line(id, x1, y1, x2, y2, stroke);
  }

  private static createText(id: string, params: string[]): Text {
    if (params.length !== 3) {
      throw new Error('error: usage: create text <id> <x> <y> "content"');
    }
    const [x, y] = ShapeFactory.requireNumbers(params.slice(0, 2));
    return new Text(id, x, y, params[2]);
  }

  private static createGroup(id: string, params: string[]): Group {
    if (params.length !== 0) {
      throw new Error("error: usage: create g <id>");
    }
    return new Group(id);
  }

  /**
   * 从 SVG 标签属性构造图形（读盘路径；按名字分派仍仅在本工厂）。
   */
  static fromSvg(
    tag: string,
    id: string,
    attrs: Record<string, string>,
    textContent = "",
  ): Shape {
    switch (tag) {
      case "rect": {
        const shape = new Rect(
          id,
          num(attrs.x, 0),
          num(attrs.y, 0),
          num(attrs.width, 0),
          num(attrs.height, 0),
          attrs.fill,
        );
        applyStyle(shape, attrs);
        return shape;
      }
      case "circle": {
        const shape = new Circle(
          id,
          num(attrs.cx, 0),
          num(attrs.cy, 0),
          num(attrs.r, 0),
          attrs.fill,
        );
        applyStyle(shape, attrs);
        return shape;
      }
      case "ellipse": {
        const shape = new Ellipse(
          id,
          num(attrs.cx, 0),
          num(attrs.cy, 0),
          num(attrs.rx, 0),
          num(attrs.ry, 0),
          attrs.fill,
        );
        applyStyle(shape, attrs);
        return shape;
      }
      case "line": {
        const shape = new Line(
          id,
          num(attrs.x1, 0),
          num(attrs.y1, 0),
          num(attrs.x2, 0),
          num(attrs.y2, 0),
          attrs.stroke,
        );
        if (attrs["stroke-width"] !== undefined) {
          shape.setAttribute("stroke-width", attrs["stroke-width"]);
        }
        return shape;
      }
      case "text": {
        const text = new Text(id, num(attrs.x, 0), num(attrs.y, 0), textContent);
        applyStyle(text, attrs);
        return text;
      }
      case "g":
        return new Group(id);
      default:
        throw new Error(
          `error: unknown shape type: ${tag} (is the plugin loaded?)`,
        );
    }
  }

  private static requireNumbers(raw: string[]): number[] {
    return raw.map((token) => {
      const n = Number(token);
      if (!Number.isFinite(n)) {
        throw new Error(`error: invalid number: ${token}`);
      }
      return n;
    });
  }
}

function num(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function applyStyle(shape: Shape, attrs: Record<string, string>): void {
  if (attrs.stroke !== undefined) {
    shape.setAttribute("stroke", attrs.stroke);
  }
  if (attrs["stroke-width"] !== undefined) {
    shape.setAttribute("stroke-width", attrs["stroke-width"]);
  }
}
