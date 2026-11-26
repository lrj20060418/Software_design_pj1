import type { IShapeProvider } from "../../extensions/IShapeProvider.js";
import type { Shape } from "../../model/Shape.js";
import { Circle } from "../../model/Circle.js";
import { applyStyle } from "./applyStyle.js";
import { numAttr, requireNumbers } from "./parseNumbers.js";

export class CircleShapeProvider implements IShapeProvider {
  readonly type = "circle";

  create(id: string, params: string[]): Shape {
    if (params.length < 3 || params.length > 4) {
      throw new Error(
        "error: usage: create circle <id> <cx> <cy> <r> [fill]",
      );
    }
    const [cx, cy, r] = requireNumbers(params.slice(0, 3));
    return new Circle(id, cx, cy, r, params[3]);
  }

  fromSvg(id: string, attrs: Record<string, string>): Shape {
    const shape = new Circle(
      id,
      numAttr(attrs.cx, 0),
      numAttr(attrs.cy, 0),
      numAttr(attrs.r, 0),
      attrs.fill,
    );
    applyStyle(shape, attrs);
    return shape;
  }
}
