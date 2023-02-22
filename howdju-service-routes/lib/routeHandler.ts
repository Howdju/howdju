import { ServicesProvider } from "howdju-service-common";
import { z } from "zod";

/**
 * Creates a service request handler that validates the request and delegates to an impl.
 *
 * This helper also helps with type inference from the validation schema to the impl.
 *
 * @param schema The request validation schema
 * @param impl The request handler implementation
 * @typeparam T the request's type
 * @typeparam R the response's type.
 * @returns A promise of the response
 */
export function handler<
  S extends z.ZodType<T, z.ZodTypeDef>,
  R,
  T = InferRequest<S>
>(schema: S, impl: (provider: ServicesProvider, request: T) => Promise<R>) {
  return {
    schema,
    handler: async function handleRequest(
      provider: ServicesProvider,
      request: T
    ) {
      return await impl(provider, schema.parse(request));
    },
  };
}

type InferRequest<Schema> = Schema extends z.ZodType<infer T, z.ZodTypeDef>
  ? T
  : never;
