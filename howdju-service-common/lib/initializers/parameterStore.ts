import {
  SSMClient,
  GetParametersCommand,
  Parameter,
} from "@aws-sdk/client-ssm";
import { PoolConfig } from "pg";

import { logger } from "howdju-common";

const client = new SSMClient();

export type AsyncConfig = Record<
  typeof DATABASE_CONNECTION_INFO,
  Partial<PoolConfig>
> &
  Record<typeof SCRAPING_ANT_API_KEY, string> &
  Record<typeof ZEN_ROWS_API_KEY, string>;

export const DATABASE_CONNECTION_INFO = "database-connection-info";
export const SCRAPING_ANT_API_KEY = "scraping-ant-api-key";
export const ZEN_ROWS_API_KEY = "zen-rows-api-key";
// Only call AWS in production or in tests where we have mocked the AWS connection.
// Locally, config must come from env vars.
const activeNodeEnvs = new Set(["production", "test"]);

export async function getParameterStoreConfig(
  environment: string
): Promise<AsyncConfig> {
  if (!activeNodeEnvs.has(process.env.NODE_ENV || "")) {
    return {} as AsyncConfig;
  }

  const response = await client.send(
    new GetParametersCommand({
      Names: [
        `/${environment}/${DATABASE_CONNECTION_INFO}`,
        `/${environment}/${SCRAPING_ANT_API_KEY}`,
        `/${environment}/${ZEN_ROWS_API_KEY}`,
      ],
      WithDecryption: true,
    })
  );

  if (response.InvalidParameters?.length) {
    throw new Error(
      `Invalid Parameter Store parameters: ${response.InvalidParameters}`
    );
  }
  if (!response.Parameters?.length) {
    throw new Error("No Parameter Store parameters");
  }
  const invalidParameters: Parameter[] = [];
  const pairs = response.Parameters.map((parameter) => {
    const { Name, Value } = parameter;
    if (!Name) {
      invalidParameters.push(parameter);
      return {};
    }
    const name = extractName(Name);

    let value;
    try {
      value = JSON.parse(Value || "");
    } catch (error) {
      // Note it's unsafe to log the value here, as it could contain secrets.
      logger.warn(
        `Failed to parse parameter store parameter ${Name} value as JSON (falling back to string)`
      );
      value = Value;
    }

    return {
      [name]: value,
    };
  });
  if (invalidParameters.length) {
    throw new Error(
      `Invalid Parameter Store parameters (missing Name): ${invalidParameters}`
    );
  }
  // Combine the pairs into a single object.
  return pairs.reduce((acc, cur) => ({ ...acc, ...cur }), {}) as AsyncConfig;
}

function extractName(fullName: string) {
  const index = fullName.lastIndexOf("/");
  if (index < 0) {
    throw new Error(
      `Invalid Parameter Store parameter name (no slash): ${fullName}`
    );
  }
  const name = fullName.substring(index + 1);
  if (!name) {
    throw new Error(
      `Invalid Parameter Store parameter name (empty name): ${fullName}`
    );
  }
  return name;
}
