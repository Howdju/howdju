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
  StatementCompoundValidator,
  UrlValidator,
  UserValidator,
  VoteValidator,
} = require('howdju-service-common')



const urlValidator = new UrlValidator()
const userValidator = new UserValidator()
const statementValidator = new StatementValidator()
const statementCompoundValidator = new StatementCompoundValidator(statementValidator)
const writValidator = new WritValidator()
const writQuoteValidator = new WritQuoteValidator(writValidator, urlValidator)
const sourceExcerptValidator = new SourceExcerptValidator(writQuoteValidator)
const sourceExcerptParaphraseValidator = new SourceExcerptParaphraseValidator(statementValidator, sourceExcerptValidator)
const justificationBasisCompoundAtomValidator = new JustificationBasisCompoundAtomValidator(statementValidator,
    sourceExcerptParaphraseValidator)
const justificationBasisCompoundValidator = new JustificationBasisCompoundValidator(justificationBasisCompoundAtomValidator)
const justificationValidator = new JustificationValidator(statementValidator, statementCompoundValidator, writQuoteValidator)
const credentialValidator = new CredentialValidator()
const voteValidator = new VoteValidator()

module.exports = {
  credentialValidator,
  justificationValidator,
  justificationBasisCompoundValidator,
  statementValidator,
  statementCompoundValidator,
  urlValidator,
  userValidator,
  voteValidator,
  writValidator,
  writQuoteValidator,
}