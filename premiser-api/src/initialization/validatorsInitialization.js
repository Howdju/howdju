const {
  WritValidator,
  WritQuoteValidator,
  CredentialValidator,
  JustificationValidator,
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
const justificationValidator = new JustificationValidator(statementValidator, statementCompoundValidator, writQuoteValidator)
const credentialValidator = new CredentialValidator()
const voteValidator = new VoteValidator()

module.exports = {
  urlValidator,
  userValidator,
  statementValidator,
  statementCompoundValidator,
  writValidator,
  writQuoteValidator,
  justificationValidator,
  credentialValidator,
  voteValidator,
}