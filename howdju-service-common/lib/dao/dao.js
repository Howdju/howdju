const assign = require('lodash/assign')

module.exports = assign(
    {},
    require('./JobHistoryDao'),
    require('./JustificationScoresDao'),
    require('./orm'),
    require('./VotesDao')
)