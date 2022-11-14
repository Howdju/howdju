// Just export console for now; it should be fine for client environments.
// Later we can do things like initialize the logger from apps where we can
// configure logging levels. We could buffer log calls made before initialization etc.
module.exports.logger = console;
