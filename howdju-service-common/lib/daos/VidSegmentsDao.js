const {
  requireArgs
} = require('howdju-common')

exports.VidSegmentsDao = class VidSegmentsDao {

  constructor(logger, database) {
    requireArgs({logger, database})
    this.logger = logger
    this.database = database
  }

  readVidSegmentsByIdForRootStatementId() {
    this.logger.debug('readVidSegmentsByIdForRootStatementId is unimplemented')
    return {}
  }
}