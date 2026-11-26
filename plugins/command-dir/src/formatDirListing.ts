import type { DirectoryEntry } from "./IDirectoryAccess.js";

/**
 * 将目录项格式化为 `dir` 命令输出（稳定排序）。
 * 目录在前、文件在后；各组按名称升序（localeCompare）。
 */
export function formatDirListing(entries: DirectoryEntry[]): string {
  if (entries.length === 0) {
    return "(empty directory)";
  }

  const dirs = entries
    .filter((e) => e.kind === "dir")
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
  const files = entries
    .filter((e) => e.kind !== "dir")
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const lines: string[] = [];
  for (const name of dirs) {
    lines.push(`[DIR]  ${name}`);
  }
  for (const name of files) {
    lines.push(`[FILE] ${name}`);
  }
  return lines.join("\n");
}
