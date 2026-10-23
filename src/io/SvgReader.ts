import * as fs from "node:fs";
import { Document } from "../model/Document.js";
import { Group } from "../model/Group.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import type { Shape } from "../model/Shape.js";

const SUPPORTED = new Set(["rect", "circle", "ellipse", "line", "text", "g"]);

interface XmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
}

/**
 * 将 .svg 文件解析为 Document（缺 id 时自动补全并收集 warning）。
 * 依赖 model，不依赖 cli / commands。
 */
export class SvgReader {
  read(filePath: string, document: Document): string[] {
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, "utf8");
    } catch {
      throw new Error(`error: cannot read file: ${filePath}`);
    }

    const warnings: string[] = [];
    const root = parseSvg(raw);
    const width = numAttr(root.attrs.width, 800);
    const height = numAttr(root.attrs.height, 600);

    document.init(width, height);
    document.setSourcePath(filePath);

    const idCounters = new Map<string, number>();
    const usedIds = new Set<string>();

    for (const child of root.children) {
      const shape = this.buildShape(child, idCounters, usedIds, warnings);
      if (shape) {
        document.importRoot(shape);
      }
    }

    return warnings;
  }

  private buildShape(
    node: XmlNode,
    idCounters: Map<string, number>,
    usedIds: Set<string>,
    warnings: string[],
  ): Shape | null {
    const tag = node.tag.toLowerCase();
    if (!SUPPORTED.has(tag)) {
      return null;
    }

    let id = node.attrs.id;
    if (!id) {
      id = allocateId(tag, idCounters, usedIds);
      warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
    } else if (usedIds.has(id)) {
      const assigned = allocateId(tag, idCounters, usedIds);
      warnings.push(`warning: assigned id ${assigned} to unnamed <${tag}>`);
      id = assigned;
    }
    usedIds.add(id);

    if (tag === "g") {
      const group = ShapeFactory.fromSvg("g", id, node.attrs) as Group;
      for (const child of node.children) {
        const nested = this.buildShape(child, idCounters, usedIds, warnings);
        if (nested) {
          group.addChild(nested);
        }
      }
      return group;
    }

    const textContent = tag === "text" ? unescapeXml(node.text.trim()) : "";
    return ShapeFactory.fromSvg(tag, id, node.attrs, textContent);
  }
}

function allocateId(
  tag: string,
  counters: Map<string, number>,
  usedIds: Set<string>,
): string {
  let n = counters.get(tag) ?? 0;
  let candidate: string;
  do {
    n += 1;
    candidate = `${tag}${n}`;
  } while (usedIds.has(candidate));
  counters.set(tag, n);
  return candidate;
}

function numAttr(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const n = Number(String(raw).replace(/px$/i, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function unescapeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseSvg(xml: string): XmlNode {
  const cleaned = xml
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  const svgMatch = /<svg\b([^>]*)>/i.exec(cleaned);
  if (!svgMatch) {
    throw new Error("error: cannot read file: missing <svg>");
  }

  const openEnd = (svgMatch.index ?? 0) + svgMatch[0].length;
  const closeIdx = cleaned.toLowerCase().lastIndexOf("</svg>");
  if (closeIdx < 0) {
    throw new Error("error: cannot read file: missing </svg>");
  }

  const inner = cleaned.slice(openEnd, closeIdx);
  return {
    tag: "svg",
    attrs: parseAttrs(svgMatch[1]),
    children: parseElementList(inner),
    text: "",
  };
}

function parseElementList(input: string): XmlNode[] {
  const nodes: XmlNode[] = [];
  let rest = input.trim();
  while (rest.length > 0) {
    const trimmed = rest.trimStart();
    if (!trimmed.startsWith("<") || trimmed.startsWith("</")) {
      break;
    }
    if (trimmed.startsWith("<!--")) {
      const end = trimmed.indexOf("-->");
      rest = end < 0 ? "" : trimmed.slice(end + 3);
      continue;
    }
    const { node, consumed } = parseOneElement(trimmed);
    nodes.push(node);
    rest = trimmed.slice(consumed);
  }
  return nodes;
}

function parseOneElement(s: string): { node: XmlNode; consumed: number } {
  const tagMatch = /^<([a-zA-Z_][\w:.-]*)([^>]*)>/.exec(s);
  if (!tagMatch) {
    throw new Error("error: cannot read file: malformed svg");
  }
  const rawTag = tagMatch[1];
  const tag = (rawTag.includes(":") ? rawTag.split(":").pop()! : rawTag).toLowerCase();
  const attrText = tagMatch[2];
  const selfClosing = /\/\s*$/.test(attrText);
  const attrs = parseAttrs(attrText.replace(/\/\s*$/, ""));
  let pos = tagMatch[0].length;

  if (selfClosing) {
    return { node: { tag, attrs, children: [], text: "" }, consumed: pos };
  }

  const closeExact = `</${rawTag}>`;
  const closeLower = `</${tag}>`;
  let text = "";
  const children: XmlNode[] = [];

  while (pos < s.length) {
    if (
      s.startsWith(closeExact, pos) ||
      s.slice(pos, pos + closeLower.length).toLowerCase() === closeLower
    ) {
      const closerLen = s.startsWith(closeExact, pos)
        ? closeExact.length
        : closeLower.length;
      pos += closerLen;
      return { node: { tag, attrs, children, text }, consumed: pos };
    }

    if (s[pos] !== "<") {
      const next = s.indexOf("<", pos);
      const chunk = next < 0 ? s.slice(pos) : s.slice(pos, next);
      text += chunk;
      pos = next < 0 ? s.length : next;
      continue;
    }

    if (s.startsWith("<!--", pos)) {
      const end = s.indexOf("-->", pos);
      pos = end < 0 ? s.length : end + 3;
      continue;
    }

    if (s.startsWith("</", pos)) {
      break;
    }

    const nested = parseOneElement(s.slice(pos));
    children.push(nested.node);
    pos += nested.consumed;
  }

  return { node: { tag, attrs, children, text }, consumed: pos };
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([:@\w.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const name = m[1].includes(":") ? m[1].split(":").pop()! : m[1];
    attrs[name] = m[2] ?? m[3] ?? "";
  }
  return attrs;
}
