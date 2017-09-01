const assign = require('lodash/assign')

module.exports = assign(
  {},
  require('./ActionsDao'),
  require('./AuthDao'),
  require('./CitationReferencesDao'),
  require('./CitationsDao'),
  require('./JobHistoryDao'),
  require('./JustificationScoresDao'),
  require('./JustificationsDao'),
  require('./PermissionsDao'),
  require('./PerspectivesDao'),
  require('./StatementCompoundsDao'),
  require('./StatementsDao'),
  require('./UrlsDao'),
  require('./UserExternalIdsDao'),
  require('./UserGroupsDao'),
  require('./UserPermissionsDao'),
  require('./UsersDao'),
  require('./VotesDao'),
  require('./orm')
)
