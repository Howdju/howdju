import { keys } from "lodash";

import {
  ContentReportTypes,
  EntityTypes,
  JustificationPolarities,
  JustificationRootPolarities,
} from "./enums";

export const schemaSettings = {
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
  paidContributionsDisclosureTextMaxLength: 4096,
  reportContentDescriptionMaxLength: 4096,
} as const;

export const definitionsSchema = {
  $id: "https://howdju.com/schemas/definitions.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Definitions",
  description: "Contains re-usable definitions for other schemas",
  definitions: {
    username: {
      type: "string",
      pattern: "^[A-Za-z0-9_]+$",
      description:
        "The user-selected identifier by which the user is publicly known in the system.  Letters, numbers, and underscore.",
      minLength: schemaSettings.usernameMinLength,
      maxLength: schemaSettings.usernameMaxLength,
    },
    password: {
      type: "string",
      description: "The user's selected password",
      minLength: schemaSettings.passwordMinLength,
      maxLength: schemaSettings.passwordMaxLength,
    },
    userEmail: {
      type: "string",
      format: "email",
      description:
        "The user's preferred email for receiving correspondence about the system",
      maxLength: schemaSettings.userEmailMaxLength,
    },
    shortName: {
      type: "string",
      description: "The user's preferred first name or common name",
      examples: ["Carl", "Rich", "Anu"],
      maxLength: schemaSettings.shortNameMaxLength,
    },
    longName: {
      type: "string",
      description: "The user's actual full legal name",
      examples: ["Carl Gieringer", "Anuradha Sathya"],
      minLength: 1,
      maxLength: schemaSettings.longNameMaxLength,
    },
    entityId: {
      type: "string",
      format: "int32",
      description:
        "An identifier for an entity. Usually used in the database to identify the entity. A positive integer" +
        " formatted as a string.",
      examples: ["1", "2", "42"],
    },
    justificationPolarity: {
      enum: JustificationPolarities,
    },
    justificationRootPolarity: {
      enum: JustificationRootPolarities,
    },
  },
} as const;

const passwordResetRequest = {
  $id: "https://howdju.com/schemas/password-reset-request.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PasswordResetRequest",
  description: "A request to reset a password",
  type: "object",
  required: ["email"],
  properties: {
    email: { $ref: "definitions.json#/definitions/userEmail" },
  },
} as const;

const passwordResetConfirmation = {
  $id: "https://howdju.com/schemas/password-reset-confirmation.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PasswordResetConfirmation",
  description: "A confirmation to reset a password",
  type: "object",
  required: ["newPassword"],
  properties: {
    newPassword: { $ref: "definitions.json#/definitions/password" },
  },
} as const;

const registrationRequest = {
  $id: "https://howdju.com/schemas/registration-request.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "RegistrationRequest",
  description: "A request to register a new user",
  type: "object",
  required: ["email"],
  properties: {
    email: { $ref: "definitions.json#/definitions/userEmail" },
  },
} as const;

const registrationConfirmation = {
  $id: "https://howdju.com/schemas/registration-confirmation.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "RegistrationConfirmation",
  description:
    "The information necessary to complete a registration and make a user",
  type: "object",
  required: [
    "username",
    "longName",
    "password",
    "doesAcceptTerms",
    "is13YearsOrOlder",
    "hasMajorityConsent",
    "isNotGdpr",
  ],
  properties: {
    username: { $ref: "definitions.json#/definitions/username" },
    password: { $ref: "definitions.json#/definitions/password" },
    shortName: { $ref: "definitions.json#/definitions/shortName" },
    longName: { $ref: "definitions.json#/definitions/longName" },
    doesAcceptTerms: {
      const: true,
      description: "Whether the user agreed to the terms.  Must be true.",
    },
    is13YearsOrOlder: {
      const: true,
      description: "Whether the user is 13 years or older.  Must be true.",
    },
    hasMajorityConsent: {
      const: true,
      description:
        "Whether the user affirms that they are old enough to accept the terms.  Must be true.",
    },
    isNotGdpr: {
      const: true,
      description:
        "Whether the user is not subject to the GDPR.  Must be true.",
    },
  },
} as const;

const user = {
  $id: "https://howdju.com/schemas/user.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "User",
  description: "A user of the system",
  type: "object",
  required: [
    "email",
    "username",
    "longName",
    "acceptedTerms",
    "affirmedMajorityConsent",
    "affirmed13YearsOrOlder",
    "affirmedNotGdpr",
  ],
  properties: {
    username: { $ref: "definitions.json#/definitions/username" },
    email: { $ref: "definitions.json#/definitions/userEmail" },
    shortName: { $ref: "definitions.json#/definitions/shortName" },
    longName: { $ref: "definitions.json#/definitions/longName" },
    acceptedTerms: {
      description: "The time when the user accepted the terms.",
      type: "string",
      format: "date-time",
    },
    affirmedMajorityConsent: {
      description:
        "The time when the user affirmed that they had majority consent to accept the terms.",
      type: "string",
      format: "date-time",
    },
    affirmed13YearsOrOlder: {
      description:
        "The time when the user affirmed that they are older than 13 years.",
      type: "string",
      format: "date-time",
    },
    affirmedNotGdpr: {
      description:
        "The time when the user affirmed that GDPR does not apply to them.",
      type: "string",
      format: "date-time",
    },
  },
} as const;

const contentReport = {
  $id: "https://howdju.com/schemas/content-report.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Content Report",
  description:
    "A user-submitted report of content that may violate our policies.",
  type: "object",
  required: ["url", "types"],
  properties: {
    entityType: {
      description:
        "The type of entity being reported, if the report can pertain to a particular entity.",
      enum: keys(EntityTypes),
    },
    entityId: { $ref: "definitions.json#/definitions/entityId" },
    url: {
      description:
        "The URL upon which the user made the report, and so likely an URL where the content appears.",
      type: "string",
      format: "uri",
    },
    types: {
      type: "array",
      uniqueItems: true,
      items: { enum: keys(ContentReportTypes) },
      // A report must have at least one type
      minItems: 1,
    },
    description: {
      description: "The user's description of the report.",
      type: "string",
      maxLength: schemaSettings.reportContentDescriptionMaxLength,
    },
  },
} as const;

const writ = {
  $id: "https://howdju.com/schemas/writ.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Writ",
  description: "A textual media source. Ex a book or news article.",
  type: "object",
  required: ["textQuote", "writ"],
  properties: {
    title: {
      type: "string",
      maxLength: schemaSettings.writTitleMaxLength,
      description: "The title of the Writ. Ex: the title of a book.",
    },
  },
} as const;

const writQuote = {
  $id: "https://howdju.com/schemas/writ-quote.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "WritQuote",
  description: "A quoted excerpt from textual media.",
  type: "object",
  required: ["textQuote", "writ"],
  properties: {
    textQuote: {
      type: "string",
      maxLength: schemaSettings.writQuoteQuoteTextMaxLength,
      description: "The text quoted from the media.",
    },
    writ: { $ref: "https://howdju.com/schemas/writ.schema.json" },
    urls: {
      description: "URLs where users can find the quote.",
      type: "array",
      items: {
        type: "string",
        format: "uri",
      },
    },
  },
} as const;

const persorg = {
  $id: "https://howdju.com/schemas/persorg.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Persorg",
  description: "A person or organization. Something that can be a speaker.",
  type: "object",
  required: ["name", "isOrganization", "knownFor"],
  properties: {
    name: {
      type: "string",
      maxLength: schemaSettings.persorgNameMaxLength,
      description: "The name of the persorg.",
    },
    isOrganization: {
      type: "boolean",
      description: "Whether the persorg is an organization (or a person.)",
    },
    knownFor: {
      type: "string",
      maxLength: schemaSettings.persorgKnownForMaxLength,
      description:
        "A short desription of what the persorg is known for, to help distinguish the persorg from other" +
        " persorgs, to provide context about the persorg's significance, or to provide context about the significance" +
        " or motivationi for the persorg's speech.",
    },
    websiteUrl: {
      type: "string",
      format: "uri",
      maxLength: schemaSettings.urlMaxLength,
      description:
        "The URL of the website the persorg represents as its primary website. If there is none, then then" +
        " the generally accepted primary website representing the persorg.",
    },
    twitterUrl: {
      type: "string",
      format: "uri",
      maxLength: schemaSettings.urlMaxLength,
      description:
        "The URL of the Twitter profile that the persorg represents as belonging to it. If the persorg does" +
        " not publicly represent that it has a Twitter account, then no unofficial Twitter account should be substituted" +
        " here.",
    },
    wikipediaUrl: {
      type: "string",
      format: "uri",
      maxLength: schemaSettings.urlMaxLength,
      description:
        "The URL of the Wikipedia page representing the persorg. The persorg need not endorse this page.",
    },
  },
} as const;

const accountSettings = {
  $id: "https://howdju.com/schemas/account-settings.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Account Settings",
  description: "The settings associate with a user's account.",
  type: "object",
  required: [],
  properties: {
    paidContributionsDisclosure: {
      type: "string",
      description:
        "The user's disclosure that they are paid to contribute to Howdju.",
      maxLength: schemaSettings.paidContributionsDisclosureTextMaxLength,
    },
  },
} as const;

// export interface JustificationCreateModel {
//   target: JustificationTargetCreateModel;
//   basis: JustificationBasisCreateModel;
//   rootTargetType: JustificationRootTargetType;
//   rootTarget: JustificationRootTargetCreateModel;
// }

/** See JustificationCreateModel. */
const newJustification = {
  $id: "https://howdju.com/schemas/new-justification.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "New Justification",
  description: "A model for creating a new justification.",
  type: "object",
  required: [],
  properties: {
    target: {
      type: "object",
      description:
        "The new justification's targets. Only one of these will be selected upon submission.",
      properties: {},
    },
    polarity: { $ref: "definitions.json#/definitions/justificationPolarity" },
    rootPolarity: {
      $ref: "definitions.json#/definitions/justificationRootPolarity",
    },
  },
} as const;

export const schemas = {
  accountSettings,
  contentReport,
  newJustification,
  passwordResetRequest,
  passwordResetConfirmation,
  persorg,
  registrationRequest,
  registrationConfirmation,
  user,
  writ,
  writQuote,
} as const;

export const schemasById = {
  [accountSettings["$id"]]: accountSettings,
  [contentReport["$id"]]: contentReport,
  [newJustification["$id"]]: newJustification,
  [passwordResetRequest["$id"]]: passwordResetRequest,
  [passwordResetConfirmation["$id"]]: passwordResetConfirmation,
  [persorg["$id"]]: persorg,
  [registrationRequest["$id"]]: registrationRequest,
  [registrationConfirmation["$id"]]: registrationConfirmation,
  [user["$id"]]: user,
  [writ["$id"]]: writ,
  [writQuote["$id"]]: writQuote,
} as const;

export type Schema = typeof schemas[keyof typeof schemas];
export type SchemaId = typeof schemas[keyof typeof schemas]["$id"];
