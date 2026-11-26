import type { DirectoryEntry, IDirectoryAccess } from "./IDirectoryAccess.js";

/**
 * 测试替身（Adaptee 替身）：内存目录表，不触碰真实文件系统。
 */
export class FakeDirectoryAccess implements IDirectoryAccess {
  private readonly tables = new Map<string, DirectoryEntry[]>();
  private readonly failures = new Set<string>();

  seed(dirPath: string, entries: DirectoryEntry[]): void {
    this.tables.set(normalize(dirPath), entries.map((e) => ({ ...e })));
  }

  fail(dirPath: string): void {
    this.failures.add(normalize(dirPath));
  }

  list(dirPath: string): DirectoryEntry[] {
    const key = normalize(dirPath);
    if (this.failures.has(key)) {
      throw new Error(`cannot read directory: ${dirPath}`);
    }
    return (this.tables.get(key) ?? []).map((e) => ({ ...e }));
  }
}

function normalize(p: string): string {
  return p.replace(/\\/g, "/");
}
