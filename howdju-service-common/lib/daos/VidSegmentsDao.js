const {
  requireArgs,
} = require('howdju-common')

exports.VidSegmentsDao = class VidSegmentsDao {

  constructor(logger, database) {
    requireArgs({logger, database})
    this.logger = logger
    this.database = database
  }

  readVidSegmentsByIdForRootPropositionId() {
    this.logger.debug('readVidSegmentsByIdForRootPropositionId is unimplemented')
    return {}
  }
}