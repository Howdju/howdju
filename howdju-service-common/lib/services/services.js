const assign = require('lodash/assign')

module.exports = assign(
  {},
  require('./ActionsService'),
  require('./AuthService'),
  require('./WritQuotesService'),
  require('./WritsService'),
  require('./GroupsService'),
  require('./JustificationBasisCompoundsService'),
  require('./JustificationsService'),
  require('./JustificationScoresService'),
  require('./PermissionsService'),
  require('./PerspectivesService'),
  require('./PicRegionsService'),
  require('./SourceExcerptParaphrasesService'),
  require('./StatementCompoundsService'),
  require('./StatementJustificationsService'),
  require('./StatementsService'),
  require('./UrlsService'),
  require('./UsersService'),
  require('./VidSegmentsService'),
  require('./VotesService')
)