class HowdjuApiError extends Error {}

class ValidationError extends HowdjuApiError {}

class AuthenticationError extends HowdjuApiError {}

class AuthorizationError extends HowdjuApiError {}

class NotFoundError extends HowdjuApiError {}

class ImpossibleError extends HowdjuApiError {}

/** The request would cause a conflict with one or more other entities */
class EntityConflictError extends HowdjuApiError {
  constructor(conflictCodes) {
    super()

    this.conflictCodes = conflictCodes
  }
}

/** The request would conflict with the actions of one or more other users */
class UserActionsConflictError extends HowdjuApiError {
  constructor(conflictCodes) {
    super()

    this.conflictCodes = conflictCodes
  }
}

module.exports = {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ImpossibleError,
  EntityConflictError,
  UserActionsConflictError,
}