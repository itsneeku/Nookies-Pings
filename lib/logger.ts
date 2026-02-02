import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname,module",
    },
  },
  hooks: {
    logMethod(inputArgs, method) {
      const bindings = (this as any).bindings();
      if (bindings.module) {
        const msgIndex = inputArgs.findIndex((arg) => typeof arg === "string");
        if (msgIndex !== -1) {
          inputArgs[msgIndex] = `[${bindings.module}] ${inputArgs[msgIndex]}`;
        }
      }
      return method.apply(this, inputArgs as [string, ...any[]]);
    },
  },
});
