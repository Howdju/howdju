const Joi = require('joi')

const {
  extractDomain
} = require('howdju-common')

module.exports = Joi.extend((joi) => ({
  name: 'string',
  base: joi.string().uri(),
  language: {
    domainMatches: 'domain must match the RegExp {{p}}',
  },
  rules: [
    {
      name: 'domainMatches',
      description: (params) => `The domain should match the pattern ${params.p}`,
      params: {
        p: joi.object().type(RegExp).required()
      },
      validate(params, value, state, options) {

        const domain = extractDomain(value)
        if (!params.p.test(domain)) {
          // Generate an error, state and options need to be passed
          return this.createError('string.uri.domainMatches', { v: value, p: params.p }, state, options)
        }

        return value
      }
    }
  ]
}))
