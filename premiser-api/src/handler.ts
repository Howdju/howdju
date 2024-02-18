/* eslint "no-console": ["off"] */

// was this just to support loading the env file?
// process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

import {
  Context,
  APIGatewayProxyCallback,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import concat from "lodash/concat";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import join from "lodash/join";
import keys from "lodash/keys";
import pick from "lodash/pick";
import some from "lodash/some";
import sourceMapSupport from "source-map-support";
import toLower from "lodash/toLower";
import { v4 as uuidv4 } from "uuid";

sourceMapSupport.install();

import {
  filterDefined,
  HttpMethod,
  HttpStatusCode,
  httpStatusCodes,
} from "howdju-common";
import {
  AppProvider,
  AwsLogger,
  configureGatewayContext,
} from "howdju-service-common";

import { routeRequest } from "./router";
import { apiHost } from "./config/util";
import * as customHeaderKeys from "./customHeaderKeys";
import * as headerKeys from "./headerKeys";
import { ApiProvider } from "./init";
import { ApiCallback, Request, RequestIdentifiers } from "./types";

const allowedHeaders = concat(
  [
    headerKeys.AUTHORIZATION,
    headerKeys.CONTENT_ENCODING,
    headerKeys.CONTENT_TYPE,
    headerKeys.SENTRY_TRACE,
  ],
  customHeaderKeys.identifierKeys
);
type AllowedHeaders = Record<typeof allowedHeaders[number], string | undefined>;

export function handler(
  gatewayEvent: APIGatewayEvent,
  gatewayContext: Context,
  gatewayCallback: APIGatewayProxyCallback
) {
  try {
    configureGatewayContext(gatewayContext);

    const appProvider = getOrCreateAppProvider(gatewayEvent);

    const requestIdentifiers = makeRequestIdentifiers(gatewayEvent);
    configureLogger(
      appProvider.logger as unknown as AwsLogger,
      gatewayEvent,
      requestIdentifiers
    );

    appProvider.logger.silly({ gatewayContext, gatewayEvent });

    const request = makeRequest(appProvider, gatewayEvent, requestIdentifiers);
    const respond = makeGatewayResponder(
      appProvider,
      gatewayEvent,
      gatewayCallback
    );
    return routeRequest(request, appProvider, respond).catch((err) => {
      appProvider.logger.error("uncaught error after routeEvent", { err });
      gatewayCallback(err);
    });
  } catch (err) {
    console.error({ err, gatewayEvent, gatewayContext });
    return gatewayCallback(err as any);
  }
}

function makeGatewayResult(
  appProvider: AppProvider,
  {
    httpStatusCode,
    headers = {},
    body,
    origin,
  }: {
    httpStatusCode: HttpStatusCode;
    headers: AllowedHeaders | undefined;
    body: any;
    origin: string | undefined;
  }
): APIGatewayProxyResult {
  const allowedOrigin =
    origin && origin in appProvider.allowedOrigins
      ? appProvider.allowedOrigins[origin]
      : "none";
  headers = Object.assign({}, headers, {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": join(allowedHeaders, ","),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Expires: "0",
    Pragma: "no-cache",
    Vary: headerKeys.ORIGIN,
  });
  const filteredHeaders = filterDefined(headers);
  if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
    // https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
    // realm=<realm> A description of the protected area. If no realm is specified, clients often display a formatted hostname instead.
    filteredHeaders[headerKeys.WWW_AUTHENTICATE] = `Bearer realm=${apiHost()}`;
  }

  let bodyJson = "";
  if (body) {
    if (httpStatusCode === httpStatusCodes.NO_CONTENT) {
      appProvider.logger.warn("noContent response received body.  Ignoring");
    } else {
      filteredHeaders[headerKeys.CONTENT_TYPE] = "application/json";
      bodyJson = JSON.stringify(body);
    }
  }

  const response = {
    statusCode: httpStatusCode || httpStatusCodes.ERROR,
    headers: filteredHeaders,
    body: bodyJson,
  };

  return response;
}

function getHeaderValue(headers: AllowedHeaders, headerName: string) {
  let headerValue = get(headers, headerName);
  if (!headerValue) {
    const lowerHeaderName = toLower(headerName);
    if (lowerHeaderName !== headerName) {
      headerValue = get(headers, lowerHeaderName);
    }
  }
  return headerValue;
}

const authorizationHeaderPrefix = "Bearer ";
function extractAuthToken(appProvider: AppProvider, event: APIGatewayEvent) {
  const authorizationHeader = getHeaderValue(
    event.headers,
    headerKeys.AUTHORIZATION
  );
  if (!authorizationHeader) {
    return undefined;
  }
  if (!authorizationHeader.startsWith(authorizationHeaderPrefix)) {
    appProvider.logger.warn(
      `Invalid authorization header: ${authorizationHeader}`
    );
    return undefined;
  }
  return authorizationHeader.substring(authorizationHeaderPrefix.length);
}

function parseBody(appProvider: AppProvider, event: APIGatewayEvent) {
  // TODO throw error if cant' support content-type.  handle application/form?
  // example: 'content-type':'application/json;charset=UTF-8',
  const body = event.body;
  if (!body) {
    return null;
  }
  try {
    return JSON.parse(body);
  } catch (err) {
    appProvider.logger.error("Error parsing JSON body", { body, err });
    return null;
  }
}

function makeGatewayResponder(
  appProvider: AppProvider,
  gatewayEvent: APIGatewayEvent,
  gatewayCallback: APIGatewayProxyCallback
): (...args: Parameters<ApiCallback>) => ReturnType<APIGatewayProxyCallback> {
  return function gatewayResponder({ httpStatusCode, headers, body }) {
    const origin = getHeaderValue(gatewayEvent.headers, headerKeys.ORIGIN);
    const result = makeGatewayResult(appProvider, {
      httpStatusCode,
      headers,
      body,
      origin,
    });
    appProvider.logger.debug("Result status code", {
      statusCode: result.statusCode,
    });
    appProvider.logger.silly("Result", { response: result });
    return gatewayCallback(null, result);
  };
}

function configureLogger(
  logger: AwsLogger,
  gatewayEvent: APIGatewayEvent,
  requestIdentifiers: RequestIdentifiers
) {
  const loggingContext: Record<string, string> = pick(requestIdentifiers, [
    "clientRequestId",
    "serverRequestId",
  ]);
  const stage = get(gatewayEvent, ["requestContext", "stage"]);
  if (stage) {
    loggingContext.stage = stage;
  }
  logger.context = loggingContext;
}

function makeRequestIdentifiers(gatewayEvent: APIGatewayEvent) {
  const requestIdentifiers: RequestIdentifiers = {};
  const clientRequestId = getHeaderValue(
    gatewayEvent.headers,
    customHeaderKeys.REQUEST_ID
  );
  if (clientRequestId) {
    requestIdentifiers.clientRequestId = clientRequestId;
  }
  // We only need one identifier generated server-side; if AWS provides one, use it
  if (gatewayEvent.requestContext.requestId) {
    requestIdentifiers.awsRequestId = requestIdentifiers.serverRequestId =
      gatewayEvent.requestContext.requestId;
  } else {
    requestIdentifiers.serverRequestId = uuidv4();
  }
  return requestIdentifiers;
}

function makeRequest(
  appProvider: AppProvider,
  gatewayEvent: APIGatewayEvent,
  requestIdentifiers: RequestIdentifiers
): Request {
  return {
    authToken: extractAuthToken(appProvider, gatewayEvent),
    requestIdentifiers,
    clientIdentifiers: {
      sessionStorageId: getHeaderValue(
        gatewayEvent.headers,
        customHeaderKeys.SESSION_STORAGE_ID
      ),
      pageLoadId: getHeaderValue(
        gatewayEvent.headers,
        customHeaderKeys.PAGE_LOAD_ID
      ),
    },
    // TODO strip out leading /v1/ as {version: 'v1'}
    path: gatewayEvent.pathParameters?.proxy || "",
    method: gatewayEvent.httpMethod as HttpMethod,
    queryStringParams: gatewayEvent.queryStringParameters || {},
    body: parseBody(appProvider, gatewayEvent),
  };
}

// Only add the handler once even if we are hotloading in dev. Otherwise we
// get memory leaks.
function howdjuHandlerUnhandledRejectionHandler(err: Error) {
  console.error(err);
  process.exit(1);
}
if (
  !some(process.listeners("unhandledRejection"), (l) =>
    l.toString().includes("howdjuHandlerUnhandledRejectionHandler")
  )
) {
  console.log("adding howdjuHandlerUnhandledRejectionHandler");
  process.on("unhandledRejection", howdjuHandlerUnhandledRejectionHandler);
}

const appProviderByStage: Record<string, AppProvider> = {};

function getOrCreateAppProvider(gatewayEvent: APIGatewayEvent) {
  const stage = gatewayEvent.requestContext.stage;
  let appProvider = appProviderByStage[stage];
  if (!appProvider) {
    const doWarn = !isEmpty(appProviderByStage);

    appProviderByStage[stage] = appProvider = new ApiProvider(
      stage
    ) as unknown as AppProvider;

    if (doWarn) {
      appProvider.logger.warn(
        `Created a provider for ${stage} in a lambda that already has providers for: ${keys(
          appProviderByStage
        )}`
      );
    }
  }
  return appProvider;
}
