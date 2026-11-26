import * as vscode from "vscode";
import { SvgFileDecorationProvider } from "./SvgFileDecorationProvider";

export function activate(context: vscode.ExtensionContext): void {
  const decorationProvider = new SvgFileDecorationProvider();
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );
}

export function deactivate(): void {
  // no-op
}
