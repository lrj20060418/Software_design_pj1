import * as fs from "node:fs";
import type { DirectoryEntry, IDirectoryAccess } from "./IDirectoryAccess.js";

/**
 * 适配器（Adapter）：把 Node.js `fs`（Adaptee）适配为 `IDirectoryAccess`。
 *
 * 符号链接：按 `Dirent.isDirectory()` / `isFile()` 分类；
 * 指向目录的链接显示为 `[DIR]`，其余（含指向文件的链接、socket 等）显示为 `[FILE]`；
 * 不 resolve、不遍历链接目标内容。
 */
export class NodeFsDirectoryAccess implements IDirectoryAccess {
  list(dirPath: string): DirectoryEntry[] {
    let dirents: fs.Dirent[];
    try {
      dirents = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      throw new Error(`cannot read directory: ${dirPath}`);
    }

    const entries: DirectoryEntry[] = [];
    for (const ent of dirents) {
      if (ent.name === "." || ent.name === "..") {
        continue;
      }
      const kind = ent.isDirectory() ? "dir" : "file";
      entries.push({ name: ent.name, kind });
    }
    return entries;
  }
}
