const assign = require('lodash/assign')

module.exports = assign(
  {},
  require('./CredentialsValidator'),
  require('./JustificationBasisCompoundAtomValidator'),
  require('./JustificationBasisCompoundValidator'),
  require('./JustificationValidator'),
  require('./JustificationVoteValidator'),
  require('./SourceExcerptParaphraseValidator'),
  require('./SourceExcerptValidator'),
  require('./PropositionCompoundValidator'),
  require('./PropositionValidator'),
  require('./PropositionTagVoteValidator'),
  require('./TagValidator'),
  require('./UrlValidator'),
  require('./UserValidator'),
  require('./WritQuoteValidator'),
  require('./WritValidator'),
  require('./util')
)