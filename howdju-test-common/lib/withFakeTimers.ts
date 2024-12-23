/**
 * Use Jest fake timers.
 *
 * Restores real timers after each to allow third-party libraries to cleanup. See
 * https://testing-library.com/docs/using-fake-timers/
 *
 * TODO(219): should we do this in a Jest environment instead?
 */
export function withFakeTimers(config?: FakeTimersConfig) {
  beforeEach(() => {
    // Use fake timers so that we can ensure animations complete before snapshotting.
    jest.useFakeTimers(config);
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
}
