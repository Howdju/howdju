import { setupServer } from "msw/node";

/** Configures an msw fake server for the test.
 *
 * @returns the mock server
 */
export function withMockServer() {
  const server = setupServer();

  beforeAll(() => {
    server.listen();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });
  return server;
}
