import type { Shape } from "../../model/Shape.js";

export function applyStyle(shape: Shape, attrs: Record<string, string>): void {
  if (attrs.stroke !== undefined) {
    shape.setAttribute("stroke", attrs.stroke);
  }
  if (attrs["stroke-width"] !== undefined) {
    shape.setAttribute("stroke-width", attrs["stroke-width"]);
  }
}
