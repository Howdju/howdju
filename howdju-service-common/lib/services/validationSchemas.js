const get = require('lodash/get')
const set = require('lodash/set')

const Joi = require('./validation')

const {
  JustificationBasisCompoundAtomType,
  JustificationBasisType,
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationRootTargetType,
  JustificationTargetType,
  PropositionTagVotePolarity,
  schemaSettings,
  SentenceType,
  SourceExcerptType,
  UrlTargetAnchorType,
} = require('howdju-common')


const idSchema = Joi.string().empty(null)
const idMissing = Joi.object({ id: Joi.forbidden() }).unknown()

const persorgSchema = Joi.object().keys({
  id: idSchema,
  isOrganization: Joi.boolean().empty(null),
  name: Joi.string().max(schemaSettings.persorgNameMaxLength).empty(null),
  knownFor: Joi.string().max(schemaSettings.persorgKnownForMaxLength).empty(Joi.valid(null, '')),
  websiteUrl: Joi.string().uri({scheme: /https?/}).allow(null),
  twitterUrl: Joi.string().uri({scheme: /https?/}).allow(null).domainMatches(/twitter.com$/),
  wikipediaUrl: Joi.string().uri({scheme: /https?/}).allow(null).domainMatches(/wikipedia.org$/),
})
  .when(idMissing, {
    then: Joi.object({
      name: Joi.required()
    })
  })

const tagSchema = Joi.object().keys({
  id: idSchema,
  name: Joi.string().max(schemaSettings.tagNameMaxLength).empty(Joi.valid(null, ''))
})
  .when(idMissing, {
    then: Joi.object({
      name: Joi.required()
    })
  })

const propositionTagVoteSchema = Joi.object().keys({
  polarity: Joi.string().valid(...Object.keys(PropositionTagVotePolarity)),
  tag: tagSchema,
})

const propositionSchema = Joi.object().keys({
  id: idSchema,
  text: Joi.string().max(schemaSettings.propositionTextMaxLength).empty(Joi.valid(null, '')),
  tags: Joi.array().items(tagSchema),
  propositionTagVotes: Joi.array().items(propositionTagVoteSchema),
})
  .when(idMissing, {
    then: Joi.object({
      text: Joi.required()
    })
  })

const STATEMENT_SCHEMA_ID = "statement"
const statementSchema = Joi.object().keys({
  id: idSchema,
  speaker: persorgSchema,
  sentenceType: Joi.valid(...Object.keys(SentenceType)).empty(null),
  sentence: Joi
    .when('sentenceType', { is: SentenceType.STATEMENT, then: Joi.link(`#${STATEMENT_SCHEMA_ID}`) })
    .when('sentenceType', { is: SentenceType.PROPOSITION, then: propositionSchema })
})
  .when(idMissing, {
    then: Joi.object({
      speaker: Joi.required(),
      sentenceType: Joi.required(),
      sentence: Joi.required(),
    })
  })
  .id(STATEMENT_SCHEMA_ID)

const propositionCompoundSchema = Joi.object().keys({
  atoms: Joi.array().items(Joi.object().keys({
    entity: propositionSchema
  }))
})
  .when(idMissing, {
    then: Joi.object({
      atoms: Joi.array().min(1).required(),
    })
  })

const urlSchema = Joi.object().keys({
  id: idSchema,
  url: Joi.string().max(schemaSettings.urlMaxLength),
  target: Joi.object({
    date: Joi.date().utc(),
    anchors: Joi.array().min(1).items(Joi.object()
      .when('type', {is: UrlTargetAnchorType.TEXT_QUOTE, then: Joi.object({
          exact: Joi.string(),
          prefix: Joi.string(),
          suffix: Joi.string(),
          start: Joi.number(),
          end: Joi.number(),
        })}))
  })
})
  .when(idMissing, {
    then: Joi.object({
      url: Joi.required(),
    })
  })

const writSchema = Joi.object().keys({
  id: idSchema,
  title: Joi.string().max(schemaSettings.writTitleMaxLength).empty(Joi.valid(null, '')),
})
  .when(idMissing, {
    then: Joi.object({
      title: Joi.required(),
    })
  })

const writQuoteSchema = Joi.object().keys({
  id: idSchema,
  quoteText: Joi.string().max(schemaSettings.writQuoteQuoteTextMaxLength).empty(Joi.valid(null, '')),
  writ: writSchema,
  urls: Joi.array().items(urlSchema),
})
  .when(idMissing, {
    then: Joi.object({
      quoteText: Joi.required(),
      writ: Joi.required(),
    })
  })

const sourceExcerptParaphraseSchema = Joi.object().keys({
  id: idSchema,
  paraphrasingProposition: propositionSchema,
  sourceExcerpt: {
    type: Joi.valid(...Object.keys(SourceExcerptType)).required().empty(null),
    entity: Joi
      .when('type', {is: SourceExcerptType.WRIT_QUOTE, then: writQuoteSchema})
      .required()
  },
})
  .when(idMissing, {
    then: Joi.object({
      paraphrasingProposition: Joi.required(),
      sourceExcerpt: Joi.required(),
    })
  })
const justificationBasisCompoundSchema = Joi.object().keys({
  atoms: Joi.array().items(Joi.object().keys({
    type: Joi.valid(...Object.keys(JustificationBasisCompoundAtomType)).required().empty(null),
    entity: Joi
      .when('type', {is: JustificationBasisCompoundAtomType.PROPOSITION, then: propositionSchema})
      .when('type', {is: JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE, then: sourceExcerptParaphraseSchema})
      .required()
  }))
})
  .when(idMissing, {
    then: Joi.object({
      atoms: Joi.array().min(1).required(),
    })
  })

const JUSTIFICATION_SCHEMA_ID = "justification"
const justificationSchema = Joi.object().keys({
  id: idSchema,
  polarity: Joi.valid(...Object.keys(JustificationPolarity)).empty(null),
  target: Joi.object().keys({
    type: Joi.allow(...Object.keys(JustificationTargetType)).required().empty(null),
    entity: Joi
      .when('type', { is: JustificationTargetType.PROPOSITION, then: propositionSchema})
      .when('type', { is: JustificationTargetType.STATEMENT, then: statementSchema})
      .when('type', { is: JustificationTargetType.JUSTIFICATION, then: Joi.link(`#${JUSTIFICATION_SCHEMA_ID}`)})
      .required()
  }),
  basis: Joi.object().keys({
    type: Joi.valid(...Object.keys(JustificationBasisType)).required().empty(null),
    entity: Joi
      .when('type', {is: JustificationBasisType.PROPOSITION_COMPOUND, then: propositionCompoundSchema})
      .when('type', {is: JustificationBasisType.WRIT_QUOTE, then: writQuoteSchema})
      .when('type', {is: JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND, then: justificationBasisCompoundSchema})
      .required()
  }),
  // The API accepts root polarity, but since it is determined by the target, it is ignored.
  // We could throw an error if it is incorrect.
  rootPolarity: Joi.valid(...Object.keys(JustificationRootPolarity)).empty(null),
  rootTargetType: Joi.valid(...Object.keys(JustificationRootTargetType)).empty(null),
  rootTarget: Joi
    .when('rootTargetType', { is: JustificationTargetType.PROPOSITION, then: propositionSchema})
    .when('rootTargetType', { is: JustificationTargetType.STATEMENT, then: statementSchema}),
})
  .when(idMissing, {
    then: Joi.object({
      polarity: Joi.required(),
      target: Joi.required(),
      basis: Joi.required(),
      rootTargetType: Joi.required(),
      rootTarget: Joi.required(),
    })
  })
  .shared(statementSchema)
  .id(JUSTIFICATION_SCHEMA_ID)

const accountSettingSchema = Joi.object().keys({
  id: idSchema,
  userId: idSchema,
  paidContributionsDisclosure: Joi.string()
    .max(schemaSettings.paidContributionsDisclosureTextMaxLength)
    .empty(Joi.valid(null, '')),
})
  .when(idMissing, {
    then: Joi.object({
      name: Joi.required()
    })
  })

const extantEntity = Joi.object().keys({
  id: idSchema.required()
})

// const registrationSchema = Joi.object().keys({
//   username: Joi.string().regex(/[A-Za-z0-9_]+/).min(2).max(schemaSettings.usernameMaxLength),
//   email: Joi.string().email().max(schemaSettings.userEmailMaxLength),
//   shortName: Joi.string().max(schemaSettings.shortNameMaxLength),
//   longName: Joi.string().max(schemaSettings.longNameMaxLength),
//   password: Joi.string().min(6).max(schemaSettings.passwordMaxLength),
//   doesAcceptTerms: Joi.boolean().valid(true),
// })

/**
 * Converts {details:[{path,type,message}, ...]} to {path:[{type,message}]}
 * @param joiError
 */
function translateJoiError(joiError) {
  const allErrors = {}
  for (const {path, type, message} of joiError.details) {
    let errors = get(allErrors, path)
    if (!errors) {
      errors = []
      set(allErrors, path, errors)
    }
    errors.push({type, message})
  }
  return allErrors
}

module.exports = {
  accountSettingSchema,
  extantEntity,
  justificationSchema,
  persorgSchema,
  propositionSchema,
  // registrationSchema,
  statementSchema,
  urlSchema,
  translateJoiError,
}
