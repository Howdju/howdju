import { AuthToken, HttpMethod, HttpStatusCode } from "howdju-common";

import { AppProvider } from "./init";

export type Route = {
  id: string;
  method: HttpMethod;
  path?: string | RegExp;
  /** Limits the handler to routes matching these parameters */
  queryStringParameters?: Record<string, string | RegExp>;
  handler: Handler;
};

export type Handler = (
  appProvider: AppProvider,
  { callback, request }: { callback: ApiCallback; request: RoutedRequest }
) => Promise<void>;

export interface RequestIdentifiers {
  clientRequestId?: string;
  awsRequestId?: string;
  serverRequestId?: string;
}

export interface Request {
  requestIdentifiers: RequestIdentifiers;
  clientIdentifiers: {
    sessionStorageId: string | undefined;
    pageLoadId: string | undefined;
  };
  path: string;
  method: HttpMethod;
  queryStringParameters: Record<string, string | undefined>;
  authToken: AuthToken | undefined;
  // TODO(1) add a generic parameter `Body extends Record<string, any>`.
  body: Record<string, any>;
}

export interface RoutedRequest extends Request {
  pathParameters: string[];
}

export type ApiCallback = ({
  httpStatusCode,
  headers,
  body,
}: {
  httpStatusCode: HttpStatusCode;
  body?: Record<string, any>;
  headers?: Record<string, string>;
}) => void;
