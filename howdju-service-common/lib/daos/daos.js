const assign = require('lodash/assign')

module.exports = assign(
  {},
  require('./ActionsDao'),
  require('./AuthDao'),
  require('./WritQuotesDao'),
  require('./WritsDao'),
  require('./JobHistoryDao'),
  require('./JustificationsDao'),
  require('./JustificationBasisCompoundsDao'),
  require('./JustificationScoresDao'),
  require('./JustificationVotesDao'),
  require('./PermissionsDao'),
  require('./PerspectivesDao'),
  require('./PicRegionsDao'),
  require('./SourceExcerptParaphrasesDao'),
  require('./StatementCompoundsDao'),
  require('./StatementTagScoresDao'),
  require('./StatementTagVotesDao'),
  require('./StatementTagsDao'),
  require('./StatementsDao'),
  require('./TagsDao'),
  require('./UrlsDao'),
  require('./UserExternalIdsDao'),
  require('./UserGroupsDao'),
  require('./UserPermissionsDao'),
  require('./UsersDao'),
  require('./VidSegmentsDao'),
  require('./orm')
)
