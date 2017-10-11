const assign = require('lodash/assign')

const {
  WritValidator,
  WritQuoteValidator,
  CredentialValidator,
  JustificationValidator,
  JustificationBasisCompoundValidator,
  JustificationBasisCompoundAtomValidator,
  SourceExcerptValidator,
  SourceExcerptParaphraseValidator,
  StatementValidator,
  StatementTagVoteValidator,
  StatementCompoundValidator,
  TagValidator,
  UrlValidator,
  UserValidator,
  JustificationVoteValidator,
} = require('howdju-service-common')


exports.init = function init(provider) {
  const urlValidator = new UrlValidator()
  const userValidator = new UserValidator()
  const tagValidator = new TagValidator()
  const justificationVoteValidator = new JustificationVoteValidator()
  const statementTagVoteValidator = new StatementTagVoteValidator()
  const statementValidator = new StatementValidator(tagValidator)
  const statementCompoundValidator = new StatementCompoundValidator(statementValidator)
  const writValidator = new WritValidator()
  const writQuoteValidator = new WritQuoteValidator(writValidator, urlValidator)
  const sourceExcerptValidator = new SourceExcerptValidator(writQuoteValidator)
  const sourceExcerptParaphraseValidator = new SourceExcerptParaphraseValidator(statementValidator, sourceExcerptValidator)
  const justificationBasisCompoundAtomValidator = new JustificationBasisCompoundAtomValidator(statementValidator,
    sourceExcerptParaphraseValidator)
  const justificationBasisCompoundValidator = new JustificationBasisCompoundValidator(justificationBasisCompoundAtomValidator)
  const justificationValidator = new JustificationValidator(statementValidator, statementCompoundValidator, writQuoteValidator,
    justificationBasisCompoundValidator)
  const credentialValidator = new CredentialValidator()

  assign(provider, {
    credentialValidator,
    justificationValidator,
    justificationBasisCompoundValidator,
    statementValidator,
    statementCompoundValidator,
    statementTagVoteValidator,
    urlValidator,
    userValidator,
    justificationVoteValidator,
    writValidator,
    writQuoteValidator,
  })
}
