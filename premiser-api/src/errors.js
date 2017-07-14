class HowdjuApiError extends Error {
  constructor(message) {
    super(message)
  }
}

class EntityValidationError extends HowdjuApiError {
  constructor(errors) {
    super('(EntityValidationError) ' + JSON.stringify(errors))

    this.errors = errors
  }
}

class RequestValidationError extends HowdjuApiError {}

/** The user tried to do something that requires being logged in, but the user isn't logged in */
class AuthenticationError extends HowdjuApiError {}

class AuthorizationError extends HowdjuApiError {
  constructor(errors) {
    super('(AuthorizationError)' + JSON.stringify(errors))

    this.errors = errors
  }
}

/** The user tried to login with invalid credentials */
class InvalidLoginError extends HowdjuApiError {}

class NotFoundError extends HowdjuApiError {}

class ImpossibleError extends HowdjuApiError {
  constructor(message) {
    super(message)
  }
}

/** The request would cause a conflict with one or more other entities */
class EntityConflictError extends HowdjuApiError {
  constructor(errors) {
    super('(EntityConflictError)' + JSON.stringify(errors))

    this.errors = errors
  }
}

/** The request would conflict with the actions of one or more other users */
class UserActionsConflictError extends HowdjuApiError {
  constructor(errors) {
    super('(UserActionsConflictError)' + JSON.stringify(errors))

    this.errors = errors
  }
}

class EntityTooOldToModifyError extends HowdjuApiError {
  constructor(duration) {
    super('(EntityTooOldToModifyError)')

    this.duration = duration
  }
}

module.exports = {
  EntityValidationError,
  RequestValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ImpossibleError,
  EntityConflictError,
  UserActionsConflictError,
  EntityTooOldToModifyError,
  InvalidLoginError,
}