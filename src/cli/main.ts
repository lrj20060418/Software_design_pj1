import * as path from "node:path";
import { createApp, loadConfigPlugins } from "../host/createApp.js";
import { Repl } from "./Repl.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const configIdx = args.indexOf("--config");
  const useConfig = configIdx >= 0;
  const configPath =
    useConfig && args[configIdx + 1]
      ? path.resolve(args[configIdx + 1])
      : undefined;

  if (useConfig && !configPath) {
    console.log("error: usage: --config <plugins.config.json>");
    process.exitCode = 1;
    return;
  }

  const app = createApp(
    useConfig
      ? { assembly: "config", configPath, enableOptionalPlugins: false }
      : { assembly: "code" },
  );

  if (useConfig && configPath) {
    await loadConfigPlugins(app, { configPath });
  }

  const repl = new Repl(app);
  repl.start();
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.log(message.startsWith("error:") ? message : `error: ${message}`);
  process.exitCode = 1;
});
