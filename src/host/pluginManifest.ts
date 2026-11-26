/** package.json contributes 扩展名列表（含可选 exporters） */
export interface PluginContributes {
  shapes: string[];
  commands: string[];
  decorators: string[];
  attributes: string[];
  exporters: string[];
}

export interface RegisteredExtensions {
  shapes: string[];
  commands: string[];
  decorators: string[];
  attributes: string[];
  exporters: string[];
}

export function emptyContributes(): PluginContributes {
  return {
    shapes: [],
    commands: [],
    decorators: [],
    attributes: [],
    exporters: [],
  };
}

export function contributesFromPackageJson(pkg: unknown): PluginContributes {
  const obj = pkg as { contributes?: unknown };
  return normalizeContributes(obj.contributes);
}

export function normalizeContributes(raw: unknown): PluginContributes {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const list = (key: string): string[] => {
    const v = obj[key];
    return Array.isArray(v) ? v.map(String) : [];
  };
  return {
    shapes: list("shapes"),
    commands: list("commands"),
    decorators: list("decorators"),
    attributes: list("attributes"),
    exporters: list("exporters"),
  };
}

export function sortedCopy(names: string[]): string[] {
  return [...names].sort();
}

export function sameNameSet(a: string[], b: string[]): boolean {
  const as = sortedCopy(a);
  const bs = sortedCopy(b);
  if (as.length !== bs.length) {
    return false;
  }
  return as.every((n, i) => n === bs[i]);
}

export function formatManifestMismatch(
  pluginName: string,
  declared: PluginContributes,
  registered: RegisteredExtensions,
): string {
  const fmt = (c: PluginContributes | RegisteredExtensions): string =>
    `shapes=[${sortedCopy(c.shapes).join(",")}] commands=[${sortedCopy(c.commands).join(",")}] decorators=[${sortedCopy(c.decorators).join(",")}] attributes=[${sortedCopy(c.attributes).join(",")}] exporters=[${sortedCopy(c.exporters).join(",")}]`;
  return `error: plugin manifest mismatch: ${pluginName} (declared: ${fmt(declared)}, registered: ${fmt(registered)})`;
}
