import type { IShapeProvider } from "./IShapeProvider.js";

export class ShapeRegistry {
  private readonly providers = new Map<string, IShapeProvider>();

  register(provider: IShapeProvider): void {
    const key = provider.type;
    if (this.providers.has(key)) {
      throw new Error(`error: duplicate registration: shapes/${key}`);
    }
    this.providers.set(key, provider);
  }

  get(type: string): IShapeProvider | undefined {
    return this.providers.get(type);
  }

  require(type: string): IShapeProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(
        `error: unknown shape type: ${type} (is the plugin loaded?)`,
      );
    }
    return provider;
  }

  has(type: string): boolean {
    return this.providers.has(type);
  }

  types(): string[] {
    return [...this.providers.keys()];
  }
}
