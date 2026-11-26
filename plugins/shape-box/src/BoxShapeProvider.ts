import type { IShapeProvider } from "../../../src/extensions/IShapeProvider.js";
import type { Shape } from "../../../src/model/Shape.js";
import { Rect } from "../../../src/model/Rect.js";
import { Text } from "../../../src/model/Text.js";
import { Box, labelId, rectId } from "./Box.js";

export class BoxShapeProvider implements IShapeProvider {
  readonly type = "box";

  create(id: string, params: string[]): Shape {
    if (params.length !== 5) {
      throw new Error(
        'error: usage: create box <id> <x> <y> <w> <h> "<title>"',
      );
    }
    const nums = params.slice(0, 4).map((token) => {
      const n = Number(token);
      if (!Number.isFinite(n)) {
        throw new Error(`error: invalid number: ${token}`);
      }
      return n;
    });
    const [x, y, w, h] = nums;
    return Box.create(id, x, y, w, h, params[4]);
  }

  fromSvg(id: string, _attrs: Record<string, string>): Shape {
    return Box.shell(id);
  }

  complete(shape: Shape): void {
    if (!(shape instanceof Box)) {
      throw new Error("error: invalid box instance");
    }
    const children = shape.getChildren();
    if (children.length < 2) {
      throw new Error(
        `error: invalid box structure: ${shape.getId()} (missing children)`,
      );
    }
    const rect = children.find((c) => c.getId() === rectId(shape.getId()));
    const label = children.find((c) => c.getId() === labelId(shape.getId()));
    if (!(rect instanceof Rect) || !(label instanceof Text)) {
      throw new Error(
        `error: invalid box structure: ${shape.getId()} (rect/label type or id)`,
      );
    }
  }
}
