/**
 * 轻量 SVG/XML 大纲解析：产出嵌套节点，供 Outline 使用。
 * 不完整 XML 时尽量返回已解析部分或空树，不抛错。
 */

export interface OutlineNode {
  /** 显示名：有 id 为 `tag#id`，否则为 `tag` */
  name: string;
  tag: string;
  id: string | undefined;
  /** 开标签起始偏移（含 `<`） */
  startOffset: number;
  /** 元素结束偏移（闭标签后或自闭合标签后） */
  endOffset: number;
  /** 开标签名起始偏移（用于 selectionRange） */
  nameOffset: number;
  nameLength: number;
  children: OutlineNode[];
}

const CONTAINER_TAGS = new Set([
  "svg",
  "g",
  "defs",
  "symbol",
  "marker",
  "clippath",
  "mask",
  "pattern",
  "switch",
  "a",
  "foreignobject",
]);

export function isContainerTag(tag: string): boolean {
  return CONTAINER_TAGS.has(tag.toLowerCase());
}

/**
 * 解析文档文本为大纲树。任何异常或严重残缺时返回空数组。
 */
export function parseSvgOutline(text: string): OutlineNode[] {
  try {
    return parseInternal(text);
  } catch {
    return [];
  }
}

function parseInternal(text: string): OutlineNode[] {
  const roots: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    if (text[i] !== "<") {
      i++;
      continue;
    }

    // 注释
    if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }

    // CDATA
    if (text.startsWith("<![CDATA[", i)) {
      const end = text.indexOf("]]>", i + 9);
      i = end === -1 ? n : end + 3;
      continue;
    }

    // 处理指令 / DOCTYPE
    if (text.startsWith("<?", i) || text.startsWith("<!", i)) {
      const end = text.indexOf(">", i + 2);
      i = end === -1 ? n : end + 1;
      continue;
    }

    // 闭标签
    if (text.startsWith("</", i)) {
      const closeMatch = /^<\/\s*([A-Za-z_][\w:.-]*)\s*>/.exec(text.slice(i));
      if (!closeMatch) {
        // 残缺闭标签：停止继续扫描，返回已有树
        break;
      }
      const closeTag = closeMatch[1];
      const closeEnd = i + closeMatch[0].length;

      // 弹出直到匹配（容错：标签不配对时尽量对齐）
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        top.endOffset = closeEnd;
        stack.pop();
        if (top.tag.toLowerCase() === closeTag.toLowerCase()) {
          break;
        }
      }
      i = closeEnd;
      continue;
    }

    // 开标签 / 自闭合
    const openMatch =
      /^<\s*([A-Za-z_][\w:.-]*)((?:\s+[^>]*?)?)\s*(\/?)\s*>/.exec(
        text.slice(i)
      );
    if (!openMatch) {
      // 残缺开标签：清空意义不大的半截，返回已解析部分
      break;
    }

    const tag = openMatch[1];
    const attrText = openMatch[2] ?? "";
    const selfClosing = openMatch[3] === "/" || isVoidLike(tag, attrText, openMatch[0]);
    const full = openMatch[0];
    const startOffset = i;
    const nameOffset = i + full.indexOf(tag);
    const nameLength = tag.length;
    const id = extractId(attrText);
    const name = id ? `${tag}#${id}` : tag;
    const endOfOpen = i + full.length;

    const node: OutlineNode = {
      name,
      tag,
      id,
      startOffset,
      endOffset: endOfOpen,
      nameOffset,
      nameLength,
      children: [],
    };

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    if (!selfClosing) {
      stack.push(node);
    }

    i = endOfOpen;
  }

  // 未闭合的开标签：保留已收集子树，endOffset 保持开标签末尾
  return roots;
}

function extractId(attrText: string): string | undefined {
  const m = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(attrText);
  if (!m) {
    return undefined;
  }
  return m[1] ?? m[2] ?? m[3];
}

/** 兼容写成 `<rect .../>` 或历史上误写无闭合的情况：仅以 `/` 判定自闭合 */
function isVoidLike(_tag: string, _attrText: string, fullOpen: string): boolean {
  return /\/\s*>$/.test(fullOpen);
}
