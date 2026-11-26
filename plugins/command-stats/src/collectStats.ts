import type { Shape } from "../../../src/model/Shape.js";
import { Group } from "../../../src/model/Group.js";

export interface StatsResult {
  /** 叶子类型 → 数量；键顺序为首次出现顺序 */
  leafCounts: Map<string, number>;
  totalLeaves: number;
  containers: number;
}

const CONTAINER_TYPES = new Set(["g", "box"]);

/**
 * 从画布根子节点起按子节点顺序 DFS。
 * 叶子按类型计数；g/box 只计 containers；根 SVG 不计。
 */
export function collectStats(roots: readonly Shape[]): StatsResult {
  const leafCounts = new Map<string, number>();
  let totalLeaves = 0;
  let containers = 0;

  const visit = (shape: Shape): void => {
    const type = shape.getType();
    if (CONTAINER_TYPES.has(type)) {
      containers += 1;
      if (shape instanceof Group) {
        for (const child of shape.getChildren()) {
          visit(child);
        }
      }
      return;
    }

    totalLeaves += 1;
    leafCounts.set(type, (leafCounts.get(type) ?? 0) + 1);
  };

  for (const root of roots) {
    visit(root);
  }

  return { leafCounts, totalLeaves, containers };
}

export function formatStats(result: StatsResult): string {
  if (result.totalLeaves === 0 && result.containers === 0) {
    return "(total 0, containers 0)";
  }

  const parts: string[] = [];
  for (const [type, count] of result.leafCounts) {
    parts.push(`${type}: ${count}`);
  }
  parts.push(`(total ${result.totalLeaves}, containers ${result.containers})`);
  return parts.join("  ");
}
