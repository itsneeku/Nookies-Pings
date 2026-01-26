import { Result } from "better-result";

export const pyRun = async <T>(stdin: JobData) => {
  const inputBuffer = Result.try(() => Buffer.from(JSON.stringify(stdin)));

  if (inputBuffer.isErr()) {
    return Result.err({
      op: "[pyRun] stdin JSON",
      cause: inputBuffer.error,
    });
  }

  const proc = Bun.spawnSync(["uv", "run", "python", "-m", "monitor.stores"], {
    cwd: process.cwd(),
    stdin: inputBuffer.unwrap(),
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = proc.stdout.toString().trim();
  const stderr = proc.stderr.toString().trim();
  for (const line of stderr.split("\n")) {
    if (line.trim()) console.log(`[pyRun] ${line}`);
  }

  if (proc.exitCode !== 0)
    return Result.err({
      op: "[pyRun] execute",
      cause: stderr,
    });

  return Result.try(() => JSON.parse(stdout) as T).mapError((cause) => ({
    op: "[pyRun] stdout",
    cause,
  }));
};
