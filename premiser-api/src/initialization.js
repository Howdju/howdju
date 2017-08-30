const {
  VotesDao
} = require('howdju-service-common')
const {
  query
} = require('./db')

exports.votesDao = new VotesDao(query)
