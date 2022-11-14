exports.configureGatewayContext = (gatewayContext) => {
  // Otherwise the pg.Pool timeout keeps us alive
  gatewayContext.callbackWaitsForEmptyEventLoop = false;
};
