/**
 * 将一行命令拆成 token；双引号包裹的内容保留为空格字面量。
 * 例: create text t1 20 40 "My Diagram"
 *   → ["create","text","t1","20","40","My Diagram"]
 */
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && /\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  if (inQuotes) {
    throw new Error("error: unclosed quotation mark");
  }

  return tokens;
}
