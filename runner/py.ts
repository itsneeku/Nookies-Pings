const pyRun = async <T>(module: string, stdin?: any): Promise<T> => {
  console.log('[pyRun]:', stdin);
  const inputBuffer = stdin ? Buffer.from(JSON.stringify(stdin)) : undefined;
  const proc = Bun.spawnSync(["uv", "run", "python", "-m", module], {
    cwd: process.cwd(),
    stdin: inputBuffer,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = proc.stdout.toString();
  const stderr = proc.stderr.toString();

  if (stderr.trim()) {
    for (const line of stderr.trim().split("\n")) {
      if (line.trim()) console.debug(`[python] ${line}`);
    }
  }

  if (proc.exitCode !== 0) {
    // throw new Error(
    //   `Python process exited with code ${proc.exitCode}: ${stderr}`
    // );
  }

  return JSON.parse(stdout.trim()) as T;
};

export const pyGetStores = () =>
  pyRun<Record<string, any>>("scrapers.utils.get_patterns");

export const pyScrape = (jobData: MonitorJobTableRow) =>
  pyRun<ScrapedProduct>("scrapers", jobData);
