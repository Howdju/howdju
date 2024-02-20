import { Context } from "aws-lambda";

export const configureHandlerContext = (context: Context) => {
  // Otherwise the pg.Pool timeout keeps us alive
  context.callbackWaitsForEmptyEventLoop = false;
};
