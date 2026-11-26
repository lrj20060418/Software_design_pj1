import * as vscode from "vscode";
import { SvgDocumentSymbolProvider } from "./SvgDocumentSymbolProvider";
import { SvgFileDecorationProvider } from "./SvgFileDecorationProvider";

const SVG_DOCUMENT_SELECTOR: vscode.DocumentSelector = [
  { language: "xml", pattern: "**/*.svg" },
  { language: "svg", pattern: "**/*.svg" },
  { pattern: "**/*.svg", scheme: "file" },
  { pattern: "**/*.svg", scheme: "untitled" },
];

export function activate(context: vscode.ExtensionContext): void {
  const decorationProvider = new SvgFileDecorationProvider();
  const outlineProvider = new SvgDocumentSymbolProvider();

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider),
    vscode.languages.registerDocumentSymbolProvider(
      SVG_DOCUMENT_SELECTOR,
      outlineProvider
    )
  );
}

export function deactivate(): void {
  // no-op
}
