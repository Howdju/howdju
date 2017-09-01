const {
  CitationValidator,
  CitationReferenceValidator,
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
const citationValidator = new CitationValidator()
const citationReferenceValidator = new CitationReferenceValidator(citationValidator, urlValidator)
const justificationValidator = new JustificationValidator(statementValidator, statementCompoundValidator, citationReferenceValidator)
const credentialValidator = new CredentialValidator()
const voteValidator = new VoteValidator()

module.exports = {
  urlValidator,
  userValidator,
  statementValidator,
  statementCompoundValidator,
  citationValidator,
  citationReferenceValidator,
  justificationValidator,
  credentialValidator,
  voteValidator,
}