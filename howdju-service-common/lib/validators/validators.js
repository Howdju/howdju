const assign = require('lodash/assign')

module.exports = assign(
  {},
  require('./CredentialsValidator'),
  require('./JustificationBasisCompoundAtomValidator'),
  require('./JustificationBasisCompoundValidator'),
  require('./JustificationValidator'),
  require('./SourceExcerptParaphraseValidator'),
  require('./SourceExcerptValidator'),
  require('./StatementCompoundValidator'),
  require('./StatementValidator'),
  require('./UrlValidator'),
  require('./UserValidator'),
  require('./VoteValidator'),
  require('./WritQuoteValidator'),
  require('./WritValidator'),
  {genericModelBlankErrors}
)

function genericModelBlankErrors() {
  return {
    hasErrors: false,
    modelErrors: [],
    fieldErrors: {},
  }
}