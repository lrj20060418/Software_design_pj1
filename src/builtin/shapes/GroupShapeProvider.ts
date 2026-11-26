import type { IShapeProvider } from "../../extensions/IShapeProvider.js";
import type { Shape } from "../../model/Shape.js";
import { Group } from "../../model/Group.js";

export class GroupShapeProvider implements IShapeProvider {
  readonly type = "g";

  create(id: string, params: string[]): Shape {
    if (params.length !== 0) {
      throw new Error("error: usage: create g <id>");
    }
    return new Group(id);
  }

  fromSvg(id: string, _attrs: Record<string, string>): Shape {
    return new Group(id);
  }
}
