import { Result } from "better-result";

export const pyRun = async <T>(stdin: PyInput) =>
  await Result.gen(async function* () {
    const inputBuffer = yield* Result.try({
      try: () => Buffer.from(JSON.stringify(stdin)),
      catch: (error) => ({ error }),
    });

    const proc = Bun.spawnSync(["uv", "run", "python", "-m", "monitor.stores"], {
      cwd: process.cwd(),
      stdin: inputBuffer,
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = proc.stdout.toString().trim();
    const logs = proc.stderr.toString().trim();

    if (proc.exitCode !== 0) {
      return Result.err({ output, logs, exitCode: proc.exitCode });
    }

    return Result.try({
      try: () => JSON.parse(output) as T,
      catch: (error) => ({ output, logs, error }),
    }).map((data) => data);
  });
