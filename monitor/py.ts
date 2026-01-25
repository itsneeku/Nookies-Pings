import { Result } from "better-result";

import { PythonError, ParseError } from "@/lib/errors";

const pyRun = <T>(module: string, stdin?: JobData) => {
  const inputBuffer = Result.try(() =>
    stdin ? Buffer.from(JSON.stringify(stdin)) : undefined,
  ).mapError(
    (e) =>
      new ParseError({
        source: "stdin JSON",
        cause: e,
      }),
  );

  if (inputBuffer.isErr()) {
    return inputBuffer as Result<never, PythonError | ParseError>;
  }

  const proc = Result.try(() =>
    Bun.spawnSync(["uv", "run", "python", "-m", module], {
      cwd: process.cwd(),
      stdin: inputBuffer.unwrap(),
      stdout: "pipe",
      stderr: "pipe",
    }),
  ).mapError(
    (cause) =>
      new PythonError({
        module,
        exitCode: null,
        stderr: String(cause),
      }),
  );

  if (proc.isErr()) {
    return proc;
  }

  const procResult = proc.unwrap();
  const stdout = procResult.stdout.toString();
  const stderr = procResult.stderr.toString();

  if (stderr.trim()) {
    for (const line of stderr.trim().split("\n")) {
      if (line.trim()) console.debug(`[python] ${line}`);
    }
  }

  if (procResult.exitCode !== 0) {
    console.error(`Python process exited with code ${procResult.exitCode}: ${stderr}`);
    return Result.err(
      new PythonError({
        module,
        exitCode: procResult.exitCode,
        stderr,
      }),
    );
  }

  const result = stdout.trim();
  return Result.try(() => JSON.parse(result) as T).mapError(
    (cause) =>
      new ParseError({
        source: `Python stdout for ${module}`,
        cause,
      }),
  );
};

export const pyScrape = (jobData: JobData) => {
  console.log("[pyScrape] Running job:", jobData);
  return pyRun<PythonScriptResult>("monitors", jobData);
};
