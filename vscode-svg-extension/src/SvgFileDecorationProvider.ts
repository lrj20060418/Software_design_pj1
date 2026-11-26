import * as vscode from "vscode";

/**
 * Explorer 文件装饰：仅为 .svg 文件附加 `[]` 标记。
 * 不修改文件名或文件内容；目录与其它扩展名不加标记。
 */
export class SvgFileDecorationProvider implements vscode.FileDecorationProvider {
  private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[] | undefined
  >();

  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  provideFileDecoration(
    uri: vscode.Uri,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FileDecoration> {
    if (!this.isSvgFile(uri)) {
      return undefined;
    }

    return new vscode.FileDecoration("[]", "SVG file");
  }

  private isSvgFile(uri: vscode.Uri): boolean {
    // 只看路径后缀；目录 URI 通常不以 .svg 结尾，故不会被标记
    const path = uri.fsPath.replace(/\\/g, "/");
    const base = path.substring(path.lastIndexOf("/") + 1);
    return base.toLowerCase().endsWith(".svg");
  }
}
