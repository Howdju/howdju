const Joi = require('joi')

const {
  extractDomain
} = require('howdju-common')

module.exports = Joi.extend((joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.domainMatches': 'domain must match the pattern {{#pattern}}',
  },
  rules: {
    domainMatches: {
      method(pattern) {
        return this.$_addRule({ name: 'domainMatches', args: { pattern } });
      },
      args: [
        {
          name: 'pattern',
          ref: true,
          assert: (arg) => arg instanceof RegExp,
          message: 'must be a RegExp'
        }
      ],
      validate(value, helpers, {pattern}) {
        const domain = extractDomain(value)
        if (!pattern.test(domain)) {
          return helpers.error('string.domainMatches', { value, pattern })
        }
        return value
      }

    }
  },
}))
