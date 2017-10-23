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
  require('./JustificationVotesService'),
  require('./MainSearchService'),
  require('./PermissionsService'),
  require('./PerspectivesService'),
  require('./PicRegionsService'),
  require('./SourceExcerptParaphrasesService'),
  require('./StatementCompoundsService'),
  require('./StatementTagsService'),
  require('./StatementTagScoresService'),
  require('./StatementTagVotesService'),
  require('./StatementJustificationsService'),
  require('./StatementsService'),
  require('./TagsService'),
  require('./UrlsService'),
  require('./UsersService'),
  require('./VidSegmentsService')
)