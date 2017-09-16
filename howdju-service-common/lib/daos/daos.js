const assign = require('lodash/assign')

module.exports = assign(
  {},
  require('./ActionsDao'),
  require('./AuthDao'),
  require('./WritQuotesDao'),
  require('./WritsDao'),
  require('./JobHistoryDao'),
  require('./JustificationBasisCompoundsDao'),
  require('./JustificationScoresDao'),
  require('./JustificationsDao'),
  require('./PermissionsDao'),
  require('./PerspectivesDao'),
  require('./PicRegionsDao'),
  require('./SourceExcerptParaphrasesDao'),
  require('./StatementCompoundsDao'),
  require('./StatementsDao'),
  require('./UrlsDao'),
  require('./UserExternalIdsDao'),
  require('./UserGroupsDao'),
  require('./UserPermissionsDao'),
  require('./UsersDao'),
  require('./VidSegmentsDao'),
  require('./VotesDao'),
  require('./orm')
)
