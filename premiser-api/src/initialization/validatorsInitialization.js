const {
  WritingValidator,
  WritingQuoteValidator,
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
const writingValidator = new WritingValidator()
const writingQuoteValidator = new WritingQuoteValidator(writingValidator, urlValidator)
const justificationValidator = new JustificationValidator(statementValidator, statementCompoundValidator, writingQuoteValidator)
const credentialValidator = new CredentialValidator()
const voteValidator = new VoteValidator()

module.exports = {
  urlValidator,
  userValidator,
  statementValidator,
  statementCompoundValidator,
  writingValidator,
  writingQuoteValidator,
  justificationValidator,
  credentialValidator,
  voteValidator,
}