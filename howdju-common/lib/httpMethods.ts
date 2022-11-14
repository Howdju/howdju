export const httpMethods = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
} as const;
export type HttpMethod = typeof httpMethods[keyof typeof httpMethods];
