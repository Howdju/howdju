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
  require('./PropositionCompoundsService'),
  require('./PropositionTagsService'),
  require('./PropositionTagScoresService'),
  require('./PropositionTagVotesService'),
  require('./PropositionJustificationsService'),
  require('./PropositionsService'),
  require('./TagsService'),
  require('./UrlsService'),
  require('./UsersService'),
  require('./VidSegmentsService')
)