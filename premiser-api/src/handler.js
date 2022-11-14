/* eslint "no-console": ["off"] */

// was this just to support loading the env file?
// process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const concat = require("lodash/concat");
const get = require("lodash/get");
const isEmpty = require("lodash/isEmpty");
const join = require("lodash/join");
const keys = require("lodash/keys");
const pick = require("lodash/pick");
const some = require("lodash/some");
const sourceMapSupport = require("source-map-support");
const toLower = require("lodash/toLower");
const uuid = require("uuid");

sourceMapSupport.install();

const { httpStatusCodes } = require("howdju-common");
const { configureGatewayContext } = require("howdju-service-common");

const { routeRequest } = require("./route");
const { apiHost } = require("./config/util");
const customHeaderKeys = require("./customHeaderKeys");
const headerKeys = require("./headerKeys");
const { AppProvider } = require("./init");

const allowedHeaders = concat(
  [
    headerKeys.AUTHORIZATION,
    headerKeys.CONTENT_ENCODING,
    headerKeys.CONTENT_TYPE,
    headerKeys.SENTRY_TRACE,
  ],
  customHeaderKeys.identifierKeys
);

const makeResponse = (
  appProvider,
  { httpStatusCode, headers = {}, body, origin }
) => {
  headers = Object.assign({}, headers, {
    "Access-Control-Allow-Origin": appProvider.allowedOrigins[origin] || "none",
    "Access-Control-Allow-Headers": join(allowedHeaders, ","),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Expires: "0",
    Pragma: "no-cache",
    Vary: headerKeys.ORIGIN,
  });
  if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
    // https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
    // realm=<realm> A description of the protected area. If no realm is specified, clients often display a formatted hostname instead.
    headers[headerKeys.WWW_AUTHENTICATE] = `Bearer realm=${apiHost()}`;
  }

  const response = {
    statusCode: httpStatusCode || httpStatusCodes.ERROR,
    headers,
  };

  if (body) {
    if (httpStatusCode === httpStatusCodes.NO_CONTENT) {
      appProvider.logger.warn("noContent response received body.  Ignoring");
    } else {
      response.headers[headerKeys.CONTENT_TYPE] = "application/json";
      response["body"] = JSON.stringify(body);
    }
  }

  return response;
};

const getHeaderValue = (headers, headerName) => {
  let headerValue = get(headers, headerName);
  if (!headerValue) {
    const lowerHeaderName = toLower(headerName);
    if (lowerHeaderName !== headerName) {
      headerValue = get(headers, lowerHeaderName);
    }
  }
  return headerValue;
};

const authorizationHeaderPrefix = "Bearer ";
const extractAuthToken = (appProvider, event) => {
  const authorizationHeader = getHeaderValue(
    event.headers,
    headerKeys.AUTHORIZATION
  );
  if (!authorizationHeader) {
    return null;
  }
  if (!authorizationHeader.startsWith(authorizationHeaderPrefix)) {
    appProvider.logger.warn(
      `Invalid authorization header: ${authorizationHeader}`
    );
    return null;
  }
  return authorizationHeader.substring(authorizationHeaderPrefix.length);
};

const parseBody = (appProvider, event) => {
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
};

const makeResponder =
  (appProvider, gatewayEvent, gatewayCallback) =>
  ({ httpStatusCode, headers, body }) => {
    const origin = getHeaderValue(gatewayEvent.headers, headerKeys.ORIGIN);
    const response = makeResponse(appProvider, {
      httpStatusCode,
      headers,
      body,
      origin,
    });
    appProvider.logger.debug("Response status code", {
      statusCode: response.statusCode,
    });
    appProvider.logger.silly("Response", { response });
    return gatewayCallback(null, response);
  };

const configureLogger = (logger, gatewayEvent, requestIdentifiers) => {
  const loggingContext = pick(requestIdentifiers, [
    "clientRequestId",
    "serverRequestId",
  ]);
  const stage = get(gatewayEvent, ["requestContext", "stage"]);
  if (stage) {
    loggingContext.stage = stage;
  }
  logger.context = loggingContext;
};

const makeRequestIdentifiers = (gatewayEvent) => {
  const requestIdentifiers = {};
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
    requestIdentifiers.serverRequestId = uuid.v4();
  }
  return requestIdentifiers;
};

const makeRequest = (
  appProvider,
  gatewayEvent,
  gatewayCallback,
  requestIdentifiers
) => {
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
    path: gatewayEvent.pathParameters.proxy,
    method: gatewayEvent.httpMethod,
    queryStringParameters: gatewayEvent.queryStringParameters,
    body: parseBody(appProvider, gatewayEvent),
  };
};

exports.handler = (gatewayEvent, gatewayContext, gatewayCallback) => {
  try {
    configureGatewayContext(gatewayContext);

    const appProvider = getOrCreateAppProvider(gatewayEvent);

    const requestIdentifiers = makeRequestIdentifiers(gatewayEvent);
    configureLogger(appProvider.logger, gatewayEvent, requestIdentifiers);

    appProvider.logger.silly({ gatewayContext, gatewayEvent });

    const request = makeRequest(
      appProvider,
      gatewayEvent,
      gatewayCallback,
      requestIdentifiers
    );
    const respond = makeResponder(appProvider, gatewayEvent, gatewayCallback);
    return routeRequest(request, appProvider, respond).catch((err) => {
      appProvider.logger.error("uncaught error after routeEvent", { err });
      gatewayCallback(err);
    });
  } catch (err) {
    console.error({ err, gatewayEvent, gatewayContext });
    return gatewayCallback(err);
  }
};

// Only add the handler once even if we are hotloading in dev. Otherwise we
// get memory leaks.
function howdjuHandlerunhandledRejectionHandler(err) {
  console.error(err);
  process.exit(1);
}
if (
  !some(process.listeners("unhandledRejection"), (l) =>
    l.toString().includes("howdjuHandlerunhandledRejectionHandler")
  )
) {
  console.log("adding howdjuHandlerunhandledRejectionHandler");
  process.on("unhandledRejection", howdjuHandlerunhandledRejectionHandler);
}

const appProviderByStage = {};

function getOrCreateAppProvider(gatewayContext) {
  const stage = get(gatewayContext, "requestContext.stage");
  let appProvider = appProviderByStage[stage];
  if (!appProvider) {
    const doWarn = !isEmpty(appProviderByStage);

    appProviderByStage[stage] = appProvider = new AppProvider(stage);

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
