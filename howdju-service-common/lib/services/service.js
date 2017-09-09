const assign = require('lodash/assign')

module.exports = assign(
  {},
  require('./ActionsService'),
  require('./AuthService'),
  require('./WritQuotesService'),
  require('./WritsService'),
  require('./GroupsService'),
  require('./JustificationsService'),
  require('./JustificationScoresService'),
  require('./PermissionsService'),
  require('./PerspectivesService'),
  require('./StatementCompoundsService'),
  require('./StatementJustificationsService'),
  require('./StatementsService'),
  require('./UrlsService'),
  require('./UsersService'),
  require('./VotesService')
)