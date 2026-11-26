import type { IDocumentExporter } from "./IDocumentExporter.js";

export class ExporterRegistry {
  private readonly exporters = new Map<string, IDocumentExporter>();

  register(exporter: IDocumentExporter): void {
    const key = exporter.format;
    if (this.exporters.has(key)) {
      throw new Error(`error: duplicate registration: exporters/${key}`);
    }
    this.exporters.set(key, exporter);
  }

  get(format: string): IDocumentExporter | undefined {
    return this.exporters.get(format);
  }

  require(format: string): IDocumentExporter {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`error: unknown export format: ${format}`);
    }
    return exporter;
  }

  list(): IDocumentExporter[] {
    return [...this.exporters.values()];
  }

  names(): string[] {
    return [...this.exporters.keys()];
  }

  unregister(format: string): boolean {
    return this.exporters.delete(format);
  }
}
