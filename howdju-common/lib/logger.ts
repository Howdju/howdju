// Just export console for now; it should be fine for client environments.
// Later we can do things like initialize the logger from apps where we can
// configure logging levels. We could buffer log calls made before initialization etc.
export const logger = console;

type LogMethod = (...args: any[]) => void;

export interface Logger {
  log: LogMethod;

  /** aka trace */
  silly: LogMethod;
  debug: LogMethod;
  verbose: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  /** Error but with a caught exception */
  exception: LogMethod;
}
