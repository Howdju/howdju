import { Logger } from "howdju-common";
import sinon from "sinon";

export const mockLogger: Logger = {
  log: sinon.fake(console.log),
  exception: sinon.fake(console.error),
  error: sinon.fake(console.error),
  warn: sinon.fake(console.warn),
  info: sinon.fake(console.info),
  debug: sinon.fake(console.debug),
  verbose: sinon.fake(console.debug),
  silly: sinon.fake(console.debug),
};
