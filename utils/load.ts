import { ok, ResultAsync, safeTry } from "neverthrow";
const readDirectory = ResultAsync.fromThrowable(
  (path) => Array.fromAsync(Deno.readDir(path)),
  (e) => `Failed reading directory: ${e}`,
);

const importModule = ResultAsync.fromThrowable(
  (path) => import(path),
  (e) => `Failed importing module: ${e}`,
);

export const loadCommands = () =>
  safeTry(async function* () {
    const path = new URL(import.meta.resolve("$commands/"));
    const commands = new Map<string, Command>();
    const entries = yield* await readDirectory(path);

    const commandFiles = entries.filter(
      (entry) =>
        (entry.isFile && entry.name.endsWith(".ts")) || entry.isDirectory,
    );

    for (const entry of commandFiles) {
      const importPath = entry.isDirectory
        ? `${path}${entry.name}/index.ts`
        : `${path}${entry.name}`;

      const module = yield* await importModule(importPath);
      const cmd = Object.values(module).find(
        (val): val is Command =>
          val !== null &&
          typeof val === "object" &&
          "data" in val &&
          "execute" in val,
      );

      if (cmd) commands.set(cmd.data.name, cmd);
    }

    return ok(commands);
  });

export const loadModules = () =>
  safeTry(async function* () {
    const path = new URL(import.meta.resolve("$modules/"));
    const modules = new Map<string, ScrapingModule>();
    const entries = yield* await readDirectory(path);

    const moduleFolders = entries.filter(
      (entry) => (entry.isDirectory),
    );

    for (const folder of moduleFolders) {
      const config = yield* await importModule(
        `${path}${folder.name}/config.ts`,
      );
      const output = yield* await importModule(
        `${path}${folder.name}/output.ts`,
      );
      modules.set(folder.name, { config, output });
    }
    return ok(modules);
  });
