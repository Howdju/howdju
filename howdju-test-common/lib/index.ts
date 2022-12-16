import sinon from "sinon";

export const mockLogger = {
  log: sinon.fake(console.log),
  exception: sinon.fake(console.error),
  error: sinon.fake(console.error),
  warning: sinon.fake(console.warn),
  info: sinon.fake(console.info),
  debug: sinon.fake(console.debug),
  silly: sinon.fake(console.debug),
};
