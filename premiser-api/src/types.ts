import { HttpMethod, HttpStatusCode } from "howdju-common";
import { Authed, Body } from "howdju-service-routes";

export interface RequestIdentifiers {
  clientRequestId?: string;
  awsRequestId?: string;
  serverRequestId?: string;
}

export type Request<B = any> = {
  requestIdentifiers: RequestIdentifiers;
  clientIdentifiers: {
    sessionStorageId: string | undefined;
    pageLoadId: string | undefined;
  };
  queryStringParams: Record<string, string | undefined>;
  path: string;
  method: HttpMethod;
} & Partial<Authed> &
  Body<B>;

export type ApiCallback = ({
  httpStatusCode,
  headers,
  body,
}: {
  httpStatusCode: HttpStatusCode;
  body?: Record<string, any>;
  headers?: Record<string, string>;
}) => void;
