import { Context } from "aws-lambda";

export const configureGatewayContext = (gatewayContext: Context) => {
  // Otherwise the pg.Pool timeout keeps us alive
  gatewayContext.callbackWaitsForEmptyEventLoop = false;
};
