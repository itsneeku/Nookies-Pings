import { TaggedError } from "better-result";

export class DatabaseError extends TaggedError("DatabaseError")<{
  operation: string;
  message: string;
  cause?: unknown;
}>() {
  constructor(args: { operation: string; cause?: unknown }) {
    const message =
      args.cause instanceof Error
        ? `Database ${args.operation} failed: ${args.cause.message}`
        : `Database ${args.operation} failed`;
    super({ ...args, message, cause: args.cause });
  }
}

export class PythonError extends TaggedError("PythonError")<{
  module: string;
  exitCode: number | null;
  message: string;
  cause?: unknown;
}>() {
  constructor(args: { module: string; exitCode: number | null; stderr?: string }) {
    const message = args.stderr
      ? `Python module ${args.module} exited with code ${args.exitCode}: ${args.stderr}`
      : `Python module ${args.module} exited with code ${args.exitCode}`;
    super({ ...args, message });
  }
}

export class DiscordError extends TaggedError("DiscordError")<{
  operation: string;
  message: string;
  cause?: unknown;
}>() {
  constructor(args: { operation: string; cause?: unknown }) {
    const message =
      args.cause instanceof Error
        ? `Discord ${args.operation} failed: ${args.cause.message}`
        : `Discord ${args.operation} failed`;
    super({ ...args, message, cause: args.cause });
  }
}

export class ParseError extends TaggedError("ParseError")<{
  source: string;
  message: string;
  cause?: unknown;
}>() {
  constructor(args: { source: string; cause?: unknown }) {
    const message =
      args.cause instanceof Error
        ? `Failed to parse ${args.source}: ${args.cause.message}`
        : `Failed to parse ${args.source}`;
    super({ ...args, message, cause: args.cause });
  }
}

export class EnvValidationError extends TaggedError("EnvValidationError")<{
  variable: string;
  message: string;
}>() {
  constructor(args: { variable: string }) {
    super({
      ...args,
      message: `Missing or invalid environment variable: ${args.variable}`,
    });
  }
}

export class WebSocketError extends TaggedError("WebSocketError")<{
  operation: string;
  message: string;
  cause?: unknown;
}>() {
  constructor(args: { operation: string; cause?: unknown }) {
    const message =
      args.cause instanceof Error
        ? `WebSocket ${args.operation} failed: ${args.cause.message}`
        : `WebSocket ${args.operation} failed`;
    super({ ...args, message, cause: args.cause });
  }
}

export type AppError =
  | DatabaseError
  | PythonError
  | DiscordError
  | ParseError
  | EnvValidationError
  | WebSocketError;
