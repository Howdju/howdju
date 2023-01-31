import { assign, forEach, isEmpty, isUndefined, toPairs } from "lodash";

import { apiErrorCodes, toJson } from "howdju-common";
import {
  AuthenticationError,
  AuthorizationError,
  EntityConflictError,
  EntityNotFoundError,
  EntityValidationError,
  InvalidLoginError,
  NoMatchingRouteError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
  RequestValidationError,
  UserActionsConflictError,
  UserIsInactiveError,
} from "howdju-service-common";

import {
  badRequest,
  conflict,
  error,
  notFound,
  unauthenticated,
  unauthorized,
} from "./responses";
import { AppProvider } from "./init";
import { Request, ApiCallback } from "./types";
import { routes } from "./routes";

routes.options.method;

const idRoutes = toPairs(routes);

export const selectRoute = (appProvider: AppProvider, request: Request) => {
  const { path, method, queryStringParameters } = request;

  for (const [routeId, route] of idRoutes) {
    let pathMatch;

    if (route.method !== method) continue;
    if ("path" in route) {
      if (typeof route.path === "string" && route.path !== path) {
        continue;
      }
      if (
        route.path instanceof RegExp &&
        !(pathMatch = route.path.exec(path))
      ) {
        continue;
      }
    }

    if ("queryStringParameters" in route) {
      if (
        isEmpty(route.queryStringParameters) !== isEmpty(queryStringParameters)
      ) {
        continue;
      }

      let isMisMatch = false;
      forEach(route.queryStringParameters, (value: string | RegExp, name) => {
        const requestValue = queryStringParameters[name] || "";
        if (value instanceof RegExp) {
          // The regex methods cast undefined to the string 'undefined', matching some regexes you might not expect...
          if (isUndefined(requestValue) || !value.test(requestValue)) {
            isMisMatch = true;
          }
        } else if (value !== requestValue) {
          isMisMatch = true;
        }
      });
      if (isMisMatch) {
        continue;
      }
    }

    // First item is the whole match, rest are the group matches
    const pathParameters = pathMatch ? pathMatch.slice(1) : [];
    const routedRequest = assign({}, request, { pathParameters });
    appProvider.logger.debug(`selected route ${routeId}`);
    return { route, routedRequest };
  }

  throw new NoMatchingRouteError();
};

export async function routeRequest(
  request: Request,
  appProvider: AppProvider,
  callback: ApiCallback
) {
  const { route, routedRequest } = selectRoute(appProvider, request);
  try {
    await route.handler(appProvider, callback, routedRequest as any);
  } catch (err) {
    if (err instanceof EntityValidationError) {
      return badRequest({
        callback,
        body: {
          errorCode: apiErrorCodes.VALIDATION_ERROR,
          errors: err.errors,
        },
      });
    } else if (err instanceof RequestValidationError) {
      return badRequest({ callback, body: { message: err.message } });
    } else if (err instanceof EntityNotFoundError) {
      return notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.ENTITY_NOT_FOUND,
          entityType: err.entityType,
          identifier: err.identifier,
        },
      });
    } else if (err instanceof NoMatchingRouteError) {
      return notFound({
        callback,
        body: { errorCode: apiErrorCodes.ROUTE_NOT_FOUND },
      });
    } else if (err instanceof AuthenticationError) {
      return unauthenticated({ callback });
    } else if (err instanceof InvalidLoginError) {
      return badRequest({
        callback,
        body: {
          errorCode: apiErrorCodes.INVALID_LOGIN_CREDENTIALS,
        },
      });
    } else if (err instanceof AuthorizationError) {
      return unauthorized({
        callback,
        body: {
          errorCode: apiErrorCodes.AUTHORIZATION_ERROR,
          errors: err.errors,
        },
      });
    } else if (err instanceof UserIsInactiveError) {
      return error({
        callback,
        body: {
          errorCode: apiErrorCodes.USER_IS_INACTIVE_ERROR,
        },
      });
    } else if (err instanceof EntityConflictError) {
      return conflict({
        callback,
        body: {
          errorCode: apiErrorCodes.ENTITY_CONFLICT,
          errors: err.errors,
        },
      });
    } else if (err instanceof UserActionsConflictError) {
      return error({
        callback,
        body: {
          errorCode: apiErrorCodes.USER_ACTIONS_CONFLICT,
          errors: err.errors,
        },
      });
    } else if (err instanceof RegistrationExpiredError) {
      return notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.EXPIRED,
        },
      });
    } else if (err instanceof RegistrationAlreadyConsumedError) {
      return notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.CONSUMED,
        },
      });
    } else if (err instanceof Error) {
      appProvider.logger.error("Unexpected error", { err, stack: err.stack });
      return error({
        callback,
        body: { errorCode: apiErrorCodes.UNEXPECTED_ERROR },
      });
    } else {
      appProvider.logger.error("Caught unexpected non-error:", toJson(err));
      return error({
        callback,
        body: { errorCode: apiErrorCodes.UNEXPECTED_ERROR },
      });
    }
  }
}
