const {
  requireArgs
} = require('howdju-common')

exports.PicRegionsDao = class PicRegionsDao {

  constructor(logger, database) {
    requireArgs({logger, database})
    this.logger = logger
    this.database = database
  }

  readPicRegionsByIdForRootPropositionId() {
    this.logger.debug('readPicRegionsByIdForRootPropositionId is unimplemented')
    return {}
  }
}