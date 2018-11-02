const Joi = require('./validation')

const {
  schemas,
  SentenceType,
} = require('howdju-common')

const persorgSchema = Joi.object().keys({
  id: Joi.any(),
  isOrganization: Joi.boolean(),
  name: Joi.string().max(schemas.persorgNameMaxLength),
  knownFor: Joi.string().max(schemas.persorgKnownForMaxLength),
  websiteUrl: Joi.string().uri({scheme: /https?/}).allow(null),
  twitterUrl: Joi.string().uri({scheme: /https?/}).allow(null).domainMatches(/twitter.com$/),
  wikipediaUrl: Joi.string().uri({scheme: /https?/}).allow(null).domainMatches(/wikipedia.org$/),
})

const propositionSchema = Joi.object().keys({
  text: Joi.string().max(schemas.propositionTextMaxLength)
})

const statementSchema = Joi.object().keys({
  speaker: persorgSchema.required(),
  sentenceType: Joi.allow(Object.keys(SentenceType)).required(),
  sentence: Joi
    .when('sentenceType', { is: SentenceType.STATEMENT, then: Joi.lazy(() => statementSchema) })
    .when('sentenceType', { is: SentenceType.PROPOSITION, then: propositionSchema })
    .required()
})

module.exports = {
  persorgSchema,
  propositionSchema,
  statementSchema,
}