import type { IShapeProvider } from "../../../src/extensions/IShapeProvider.js";
import type { Shape } from "../../../src/model/Shape.js";
import { Diamond } from "./Diamond.js";

export class DiamondShapeProvider implements IShapeProvider {
  readonly type = "diamond";

  constructor(private readonly defaultFill: string = "#f5a623") {}

  create(id: string, params: string[]): Shape {
    if (params.length < 4 || params.length > 5) {
      throw new Error(
        "error: usage: create diamond <id> <cx> <cy> <w> <h> [fill]",
      );
    }
    const nums = params.slice(0, 4).map((token) => {
      const n = Number(token);
      if (!Number.isFinite(n)) {
        throw new Error(`error: invalid number: ${token}`);
      }
      return n;
    });
    const [cx, cy, w, h] = nums;
    if (w <= 0 || h <= 0) {
      throw new Error("error: diamond width/height must be positive");
    }
    const fill = params.length === 5 ? params[4] : this.defaultFill;
    return new Diamond(id, cx, cy, w, h, fill);
  }

  fromSvg(id: string, attrs: Record<string, string>): Shape {
    return Diamond.fromAttrs(id, attrs);
  }
}
