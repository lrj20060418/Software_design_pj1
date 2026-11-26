import type { IShapeProvider } from "../../extensions/IShapeProvider.js";
import type { Shape } from "../../model/Shape.js";
import { Ellipse } from "../../model/Ellipse.js";
import { applyStyle } from "./applyStyle.js";
import { numAttr, requireNumbers } from "./parseNumbers.js";

export class EllipseShapeProvider implements IShapeProvider {
  readonly type = "ellipse";

  create(id: string, params: string[]): Shape {
    if (params.length < 4 || params.length > 5) {
      throw new Error(
        "error: usage: create ellipse <id> <cx> <cy> <rx> <ry> [fill]",
      );
    }
    const [cx, cy, rx, ry] = requireNumbers(params.slice(0, 4));
    return new Ellipse(id, cx, cy, rx, ry, params[4]);
  }

  fromSvg(id: string, attrs: Record<string, string>): Shape {
    const shape = new Ellipse(
      id,
      numAttr(attrs.cx, 0),
      numAttr(attrs.cy, 0),
      numAttr(attrs.rx, 0),
      numAttr(attrs.ry, 0),
      attrs.fill,
    );
    applyStyle(shape, attrs);
    return shape;
  }
}
