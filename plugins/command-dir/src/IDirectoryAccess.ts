/**
 * 目录访问「目标」接口（适配器模式 Target）。
 * `dir` 命令只依赖本接口，不直接依赖 Node fs。
 */
export type DirectoryEntryKind = "dir" | "file";

export interface DirectoryEntry {
  name: string;
  kind: DirectoryEntryKind;
}

export interface IDirectoryAccess {
  /**
   * 列出目录的直接子项（不含 `.` / `..`）。
   * 读取失败时抛出 Error（由命令层格式化为 error: cannot read directory）。
   */
  list(dirPath: string): DirectoryEntry[];
}
