import {
  BespokeValidationErrors,
  EntityId,
  EntityType,
  ModelErrors,
  toJson,
} from "howdju-common";
import { Duration, Moment } from "moment";

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
    super("(EntityValidationError) " + toJson(errors));

    this.errors = errors;
  }
}

/** TODO(526) replace with InvalidRequestError */
export class RequestValidationError extends HowdjuApiError {}

/** The user did something that corresponds to HTTP 409 Conflict */
export class ConflictError extends HowdjuApiError {}

/** The user tried to do something that requires being logged in, but the user isn't logged in */
export class UnauthenticatedError extends HowdjuApiError {}

export class ReauthenticationRequiredError extends HowdjuApiError {
  authRefreshTokenExpiration: Moment;
  constructor(message: string, authRefreshTokenExpiration: Moment) {
    super(message);
    this.authRefreshTokenExpiration = authRefreshTokenExpiration;
  }
}

export class UnauthorizedError extends HowdjuApiError {
  // TODO(26): remove BespokeValidationErrors
  errors: ModelErrors<any> | BespokeValidationErrors;
  constructor(errors: ModelErrors<any> | BespokeValidationErrors) {
    super("(AuthorizationError)" + toJson(errors));

    this.errors = errors;
  }
}

/** The user tried to login with invalid credentials */
export class InvalidLoginError extends HowdjuApiError {}

export class EntityNotFoundError extends HowdjuApiError {
  constructor(
    public readonly entityType: EntityType,
    public readonly identifier?:
      | EntityId
      | EntityId[]
      | Record<string, EntityId | undefined>
  ) {
    super(
      `(EntityNotFoundError) entityType: ${entityType}; identifier(s): ${toJson(
        identifier
      )}`
    );
  }
}

export class DownstreamServiceError extends HowdjuApiError {
  constructor(message: string, public sourceError: Error) {
    super("(DownstreamServiceError) " + message);
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
    super("(EntityConflictError)" + toJson(errors));

    this.errors = errors;
  }
}

/** The request would conflict with the actions of one or more other users */
export class UserActionsConflictError extends HowdjuApiError {
  // TODO(26): remove BespokeValidationErrors
  errors: ModelErrors<any> | BespokeValidationErrors;
  constructor(errors: ModelErrors<any> | BespokeValidationErrors) {
    super("(UserActionsConflictError)" + toJson(errors));

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
