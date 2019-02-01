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

class EntityNotFoundError extends HowdjuApiError {
  constructor(entityType, identifier) {
    super(`(EntityNotFoundError) entityType: ${entityType}; identifier: ${identifier}`)

    this.entityType = entityType
    this.identifier = identifier
  }
}

class UserIsInactiveError extends HowdjuApiError {
  constructor(userId) {
    super(`(UserIsInactiveError) userId: ${userId}`)
    this.userId = userId
  }
}

class NoMatchingRouteError extends HowdjuApiError {}

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

class PasswordResetAlreadyConsumedError extends HowdjuApiError {
  constructor() {
    super('(PasswordResetAlreadyConsumedError)')
  }
}

class PasswordResetExpiredError extends HowdjuApiError {
  constructor() {
    super('(PasswordResetExpiredError)')
  }
}

class RegistrationExpiredError extends HowdjuApiError {
  constructor() {
    super('(RegistrationExpiredError)')
  }
}

class RegistrationAlreadyConsumedError extends HowdjuApiError {
  constructor() {
    super('(RegistrationAlreadyConsumedError)')
  }
}

module.exports = {
  AuthenticationError,
  AuthorizationError,
  EntityConflictError,
  EntityNotFoundError,
  EntityTooOldToModifyError,
  EntityValidationError,
  InvalidLoginError,
  NoMatchingRouteError,
  PasswordResetAlreadyConsumedError,
  PasswordResetExpiredError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
  RequestValidationError,
  UserActionsConflictError,
  UserIsInactiveError,
}