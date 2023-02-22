import {
  BespokeValidationErrors,
  EntityId,
  EntityType,
  ModelErrors,
} from "howdju-common";
import { Duration } from "moment";

export class HowdjuApiError extends Error {
  constructor(message?: string) {
    super(message);

    // See https://stackoverflow.com/a/48342359
    const actualProto = new.target.prototype;
    Object.setPrototypeOf(this, actualProto);
  }
}

/** The client sent a bad request and there is not a more specific error that applies. */
export class InvalidRequestError extends HowdjuApiError {}

export class EntityValidationError extends HowdjuApiError {
  // TODO(26): remove BespokeValidationErrors
  errors: ModelErrors<any> | BespokeValidationErrors;
  constructor(errors: ModelErrors<any> | BespokeValidationErrors) {
    super("(EntityValidationError) " + JSON.stringify(errors));

    this.errors = errors;
  }
}

export class RequestValidationError extends HowdjuApiError {}

/** The user tried to do something that requires being logged in, but the user isn't logged in */
export class AuthenticationError extends HowdjuApiError {}

export class AuthorizationError extends HowdjuApiError {
  // TODO(26): remove BespokeValidationErrors
  errors: ModelErrors<any> | BespokeValidationErrors;
  constructor(errors: ModelErrors<any> | BespokeValidationErrors) {
    super("(AuthorizationError)" + JSON.stringify(errors));

    this.errors = errors;
  }
}

/** The user tried to login with invalid credentials */
export class InvalidLoginError extends HowdjuApiError {}

export class EntityNotFoundError extends HowdjuApiError {
  entityType: EntityType;
  identifier: EntityId | undefined;
  constructor(entityType: EntityType, identifier?: EntityId) {
    super(
      `(EntityNotFoundError) entityType: ${entityType}; identifier: ${identifier}`
    );

    this.entityType = entityType;
    this.identifier = identifier;
  }
}

export class UserIsInactiveError extends HowdjuApiError {
  userId: EntityId;
  constructor(userId: EntityId) {
    super(`(UserIsInactiveError) userId: ${userId}`);
    this.userId = userId;
  }
}

export class NoMatchingRouteError extends HowdjuApiError {}

/** The request would cause a conflict with one or more other entities */
export class EntityConflictError extends HowdjuApiError {
  // TODO(26): remove BespokeValidationErrors
  errors: ModelErrors<any> | BespokeValidationErrors;
  constructor(errors: ModelErrors<any> | BespokeValidationErrors) {
    super("(EntityConflictError)" + JSON.stringify(errors));

    this.errors = errors;
  }
}

/** The request would conflict with the actions of one or more other users */
export class UserActionsConflictError extends HowdjuApiError {
  // TODO(26): remove BespokeValidationErrors
  errors: ModelErrors<any> | BespokeValidationErrors;
  constructor(errors: ModelErrors<any> | BespokeValidationErrors) {
    super("(UserActionsConflictError)" + JSON.stringify(errors));

    this.errors = errors;
  }
}

export class EntityTooOldToModifyError extends HowdjuApiError {
  duration: Duration;
  constructor(duration: Duration) {
    super("(EntityTooOldToModifyError)");

    this.duration = duration;
  }
}

export class PasswordResetAlreadyConsumedError extends HowdjuApiError {
  constructor() {
    super("(PasswordResetAlreadyConsumedError)");
  }
}

export class PasswordResetExpiredError extends HowdjuApiError {
  constructor() {
    super("(PasswordResetExpiredError)");
  }
}

export class RegistrationExpiredError extends HowdjuApiError {
  constructor() {
    super("(RegistrationExpiredError)");
  }
}

export class RegistrationAlreadyConsumedError extends HowdjuApiError {
  constructor() {
    super("(RegistrationAlreadyConsumedError)");
  }
}
