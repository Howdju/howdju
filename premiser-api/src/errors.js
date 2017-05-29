exports.ValidationError = class ValidationError extends Error {}

exports.AuthenticationError = class AuthenticationError extends Error {}

exports.AuthorizationError = class AuthorizationError extends Error {}

exports.NotFoundError = class NotFoundError extends Error {}

exports.ImpossibleError = class ImpossibleError extends Error {}

/** The request would cause a conflict with one or more other entities */
exports.EntityConflictError = class EntityConflictError extends Error {
  constructor(conflictCodes) {
    super()

    this.conflictCodes = conflictCodes
  }
}

exports.UserActionsConflictError = class UserActionsConflictError extends Error {
  constructor(conflictCodes) {
    super()

    this.conflictCodes = conflictCodes
  }
}