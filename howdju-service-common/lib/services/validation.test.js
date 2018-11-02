const Joi = require('./validation')

describe('domainMatches', () => {
  test('validates a matching domain', () => {
    const domain = 'http://www.google.com/search?q=howdju'
    const schema = Joi.string().uri().domainMatches(/google.com$/)
    const {value, error} = Joi.validate(domain, schema)
    expect(error).toBe(null)
    expect(value).toBe(domain)
  })
  test("doesn't validate a non-matching domain", () => {
    const domain = 'http://www.google.com/search?q=howdju'
    const schema = Joi.string().uri().domainMatches(/amazon.com$/)
    const {value, error} = Joi.validate(domain, schema)
    expect(error).toBeTruthy()
    expect(value).toBe(value)
  })
})
