import type { IShapeProvider } from "../../extensions/IShapeProvider.js";
import type { Shape } from "../../model/Shape.js";
import { Text } from "../../model/Text.js";
import { applyStyle } from "./applyStyle.js";
import { numAttr, requireNumbers } from "./parseNumbers.js";

export class TextShapeProvider implements IShapeProvider {
  readonly type = "text";

  create(id: string, params: string[]): Shape {
    if (params.length !== 3) {
      throw new Error('error: usage: create text <id> <x> <y> "content"');
    }
    const [x, y] = requireNumbers(params.slice(0, 2));
    return new Text(id, x, y, params[2]);
  }

  fromSvg(
    id: string,
    attrs: Record<string, string>,
    textContent = "",
  ): Shape {
    const text = new Text(id, numAttr(attrs.x, 0), numAttr(attrs.y, 0), textContent);
    applyStyle(text, attrs);
    return text;
  }
}
