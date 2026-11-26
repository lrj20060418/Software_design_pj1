import type { IShapeProvider } from "../../extensions/IShapeProvider.js";
import type { Shape } from "../../model/Shape.js";
import { Rect } from "../../model/Rect.js";
import { applyStyle } from "./applyStyle.js";
import { numAttr, requireNumbers } from "./parseNumbers.js";

export class RectShapeProvider implements IShapeProvider {
  readonly type = "rect";

  create(id: string, params: string[]): Shape {
    if (params.length < 4 || params.length > 5) {
      throw new Error(
        "error: usage: create rect <id> <x> <y> <w> <h> [fill]",
      );
    }
    const [x, y, w, h] = requireNumbers(params.slice(0, 4));
    return new Rect(id, x, y, w, h, params[4]);
  }

  fromSvg(id: string, attrs: Record<string, string>): Shape {
    const shape = new Rect(
      id,
      numAttr(attrs.x, 0),
      numAttr(attrs.y, 0),
      numAttr(attrs.width, 0),
      numAttr(attrs.height, 0),
      attrs.fill,
    );
    applyStyle(shape, attrs);
    return shape;
  }
}
