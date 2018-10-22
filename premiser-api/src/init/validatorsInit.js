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
  PropositionValidator,
  PropositionTagVoteValidator,
  PropositionCompoundValidator,
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
  const propositionTagVoteValidator = new PropositionTagVoteValidator()
  const propositionValidator = new PropositionValidator(tagValidator)
  const propositionCompoundValidator = new PropositionCompoundValidator(propositionValidator)
  const writValidator = new WritValidator()
  const writQuoteValidator = new WritQuoteValidator(writValidator, urlValidator)
  const sourceExcerptValidator = new SourceExcerptValidator(writQuoteValidator)
  const sourceExcerptParaphraseValidator = new SourceExcerptParaphraseValidator(propositionValidator, sourceExcerptValidator)
  const justificationBasisCompoundAtomValidator = new JustificationBasisCompoundAtomValidator(propositionValidator,
    sourceExcerptParaphraseValidator)
  const justificationBasisCompoundValidator = new JustificationBasisCompoundValidator(justificationBasisCompoundAtomValidator)
  const justificationValidator = new JustificationValidator(propositionValidator, propositionCompoundValidator, writQuoteValidator,
    justificationBasisCompoundValidator)
  const credentialValidator = new CredentialValidator()

  assign(provider, {
    credentialValidator,
    justificationValidator,
    justificationBasisCompoundValidator,
    propositionValidator,
    propositionCompoundValidator,
    propositionTagVoteValidator,
    urlValidator,
    userValidator,
    justificationVoteValidator,
    writValidator,
    writQuoteValidator,
  })
}
