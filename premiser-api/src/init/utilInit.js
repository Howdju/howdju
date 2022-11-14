const {
  CircularReferenceDetector,
} = require("howdju-service-common/lib/util/CircularReferenceDetector");

exports.init = function init(provider) {
  provider.circularReferenceDetector = new CircularReferenceDetector(
    provider.logger
  );
  provider.logger.debug("utilInit complete");
};
