const {
  justificationSchema,
  persorgSchema,
  propositionSchema,
  statementSchema,
  urlSchema,
} = require('./validationSchemas')

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "assertValid", "assertInvalid"] }] */

describe('propositionSchema', () => {
  test('validates a valid proposition', () => {
    const proposition = {
      text: 'a proposition',
    }
    assertValid(proposition, propositionSchema)
  })
  test('validates a valid extant proposition', () => {
    const proposition = {
      id: '1',
    }
    assertValid(proposition, propositionSchema)
  })
  test('invalidates an invalid proposition', () => {
    const proposition = {}
    assertInvalid(proposition, propositionSchema)
  })
})

describe('persorgSchema', () => {
  test('accepts a valid persorg having extra properties', () => {
    const persorg = {
      "id": "1",
      "isOrganization": false,
      "name": "Barack Obama",
      "knownFor": "44th President of the United States",
      "websiteUrl": null,
      "twitterUrl": null,
      "wikipediaUrl": null,
      "normalName": "barack obama",
      "created": "2018-11-02T05:12:24.318Z",
      "creator": {
        "id": "86",
        "externalIds": null,
      },
    }
    const expected = {
      "id": "1",
      "isOrganization": false,
      "name": "Barack Obama",
      "knownFor": "44th President of the United States",
      "websiteUrl": null,
      "twitterUrl": null,
      "wikipediaUrl": null,
    }
    assertValid(persorg, persorgSchema, expected)
  })

  test('accepts a person with no knownFor', () => {
    const persorg = {
      "isOrganization": false,
      "name": "Barack Obama",
      knownFor: '',
    }
    const expected = {
      "isOrganization": false,
      "name": "Barack Obama",
    }
    assertValid(persorg, persorgSchema, expected)
  })
})

describe('statementSchema', () => {
  test('validates a valid statement', () => {
    const statement = {
      "speaker": {
        "id": "1",
        "isOrganization": false,
        "name": "Barack Obama",
        "knownFor": "44th President of the United States",
        "websiteUrl": "http://barackobama.com",
        "twitterUrl": "http://twitter.com/barackobama",
        "wikipediaUrl": "http://en.wikipedia.org/Barack_Obama",
      },
      "sentenceType": "PROPOSITION",
      "sentence": {
        "text": "Test statement",
        "tags": [
          {
            "name": "with tag",
          },
        ],
        "propositionTagVotes": [
          {
            "polarity": "POSITIVE",
            "tag": {
              "name": "with tag",
            },
          },
        ],
      },
    }
    assertValid(statement, statementSchema)
  })
})

describe('justificationSchema', () => {
  test('validates counter-justification', () => {
    const justification = {
      "rootTargetType": "PROPOSITION",
      "rootTarget": {
        "id": "1528",
      },
      "target": {
        "type": "JUSTIFICATION",
        "entity": {
          "id": "2020",
        },
      },
      "basis": {
        "type": "PROPOSITION_COMPOUND",
        "entity": {
          "atoms": [
            {
              "entity": {
                "text": "Test counter",
              },
            },
          ],
        },
      },
      "polarity": "NEGATIVE",
    }

    assertValid(justification, justificationSchema)
  })
})


describe('urlSchema', () => {
  test('validates a URL', () => {
    const url = {
      url: 'on.the.web',
      target: {
        anchors: [
          {
            type: 'TEXT_QUOTE',
            exact: 'hi there',
            prefix: 'before',
            suffix: 'after',
            start: 1,
            end: 10,
          },
        ],
      },
    }
    assertValid(url, urlSchema)
  })
})

function assertValid(input, schema, expected = null) {
  const {value, error} = schema.validate(input, {
    abortEarly: false,
    stripUnknown: true,
  })
  expect(error).toBeFalsy()
  expect(value).toEqual(expected || input)
}

function assertInvalid(input, schema) {
  const {value, error} = schema.validate(input, {
    abortEarly: false,
  })
  expect(error).toBeTruthy()
  expect(value).toEqual(input)
}
