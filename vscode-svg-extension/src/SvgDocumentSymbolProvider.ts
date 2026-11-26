import * as vscode from "vscode";
import {
  isContainerTag,
  OutlineNode,
  parseSvgOutline,
} from "./SvgOutlineParser";

/**
 * 将 SVG 文本解析为 VSCode 原生 Outline（DocumentSymbol）树。
 */
export class SvgDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
    try {
      const roots = parseSvgOutline(document.getText());
      return roots.map((n) => this.toSymbol(document, n));
    } catch {
      // 残缺或不支持内容：清空大纲，扩展不崩溃
      return [];
    }
  }

  private toSymbol(
    document: vscode.TextDocument,
    node: OutlineNode
  ): vscode.DocumentSymbol {
    const range = new vscode.Range(
      document.positionAt(node.startOffset),
      document.positionAt(Math.max(node.endOffset, node.startOffset + 1))
    );
    const selectionRange = new vscode.Range(
      document.positionAt(node.nameOffset),
      document.positionAt(node.nameOffset + node.nameLength)
    );

    const symbol = new vscode.DocumentSymbol(
      node.name,
      "",
      isContainerTag(node.tag)
        ? vscode.SymbolKind.Namespace
        : vscode.SymbolKind.Object,
      range,
      selectionRange.contains(range.start) ? selectionRange : range
    );

    symbol.children = node.children.map((c) => this.toSymbol(document, c));
    return symbol;
  }
}
