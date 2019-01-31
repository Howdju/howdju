const schemaSettings = {
  propositionTextMaxLength: 512,
  tagNameMaxLength: 64,
  writQuoteQuoteTextMaxLength: 4096,
  writTitleMaxLength: 512,
  persorgNameMaxLength: 2048,
  persorgKnownForMaxLength: 4096,
  urlMaxLength: 8096,
  userEmailMaxLength: 128,
  usernameMinLength: 2,
  usernameMaxLength: 64,
  longNameMaxLength: 64,
  shortNameMaxLength: 32,
  passwordMinLength: 6,
  passwordMaxLength: 64,
}

const definitionsSchema = {
  $id: "https://howdju.com/schemas/definitions.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Definitions",
  "description": "Contains re-usable definitions for other schemas",
  definitions: {
    username: {
      "type": "string",
      "pattern": "^[A-Za-z0-9_]+$",
      "description": "The user-selected identifier by which the user is publicly known in the system.  Letters, numbers, and underscore.",
      minLength: schemaSettings.usernameMinLength,
      "maxLength": schemaSettings.usernameMaxLength
    },
    userEmail: {
      "type": "string",
      "format": "email",
      "description": "The user's preferred email for receiving correspondence about the system",
      "maxLength": schemaSettings.userEmailMaxLength
    },
    shortName: {
      "type": "string",
      "description": "The user's preferred first name or common name",
      "examples": [
        "Carl",
        "Rich",
        "Anu"
      ],
      "maxLength": schemaSettings.shortNameMaxLength
    },
    longName: {
      "type": "string",
      "description": "The user's actual full legal name",
      "examples": [
        "Carl Gieringer",
        "Anuradha Sathya"
      ],
      "minLength": 1,
      "maxLength": schemaSettings.longNameMaxLength
    }
  }
}

const registrationConfirmation = {
  "$id": "https://howdju.com/schemas/registration-confirmation.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RegistrationConfirmation",
  "description": "The information necessary to complete a registration and make a user",
  "type": "object",
  "required": ["username", "longName", "password", "doesAcceptTerms"],
  "properties": {
    "username": { $ref: 'definitions.json#/definitions/username'},
    "password": {
      "type": "string",
      "description": "The user's selected password",
      "minLength": schemaSettings.passwordMinLength,
      "maxLength": schemaSettings.passwordMaxLength
    },
    "shortName": { $ref: 'definitions.json#/definitions/shortName' },
    "longName": { $ref: 'definitions.json#/definitions/longName' },
    "doesAcceptTerms": {
      "const": true,
      "description": "Whether the user agreed to the terms.  Must be true."
    }
  }
}

const registration = {
  "$id": "https://howdju.com/schemas/registration.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Registration",
  "description": "A record of an intent to create a user",
  "type": "object",
  "required": ["email"],
  "properties": {
    "email": { "$ref": 'definitions.json#/definitions/userEmail' },
  }
}

const user = {
  "$id": "https://howdju.com/schemas/user.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "description": "A user of the system",
  "type": "object",
  "required": ["email", "username", "longName", "acceptedTerms"],
  "properties": {
    username: { $ref: 'definitions.json#/definitions/username'},
    email: { $ref: 'definitions.json#/definitions/userEmail'},
    shortName: { $ref: 'definitions.json#/definitions/shortName'},
    longName: { $ref: 'definitions.json#/definitions/longName'},
    acceptedTerms: {
      description: 'The time when the user accepted the terms.',
      oneOf: [
        { 
          type: 'string',
          format: 'date-time',
        },
        { isMoment: {} }
      ]
    },
  }
}

module.exports = {
  schemaSettings,
  schemas: {
    registration,
    registrationConfirmation,
    user,
  },
  definitionsSchema,
}