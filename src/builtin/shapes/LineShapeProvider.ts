import type { IShapeProvider } from "../../extensions/IShapeProvider.js";
import type { Shape } from "../../model/Shape.js";
import { Line } from "../../model/Line.js";
import { numAttr, requireNumbers } from "./parseNumbers.js";

export class LineShapeProvider implements IShapeProvider {
  readonly type = "line";

  create(id: string, params: string[]): Shape {
    if (params.length < 4 || params.length > 5) {
      throw new Error(
        "error: usage: create line <id> <x1> <y1> <x2> <y2> [stroke]",
      );
    }
    const [x1, y1, x2, y2] = requireNumbers(params.slice(0, 4));
    return new Line(id, x1, y1, x2, y2, params[4]);
  }

  fromSvg(id: string, attrs: Record<string, string>): Shape {
    const shape = new Line(
      id,
      numAttr(attrs.x1, 0),
      numAttr(attrs.y1, 0),
      numAttr(attrs.x2, 0),
      numAttr(attrs.y2, 0),
      attrs.stroke,
    );
    if (attrs["stroke-width"] !== undefined) {
      shape.setAttribute("stroke-width", attrs["stroke-width"]);
    }
    return shape;
  }
}
