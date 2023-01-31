import { AuthToken, HttpMethod, HttpStatusCode } from "howdju-common";

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

export type ApiCallback = ({
  httpStatusCode,
  headers,
  body,
}: {
  httpStatusCode: HttpStatusCode;
  body?: Record<string, any>;
  headers?: Record<string, string>;
}) => void;
