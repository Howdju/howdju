exports.apiHost = () => {
  let apiHost = process.env["API_HOST"];
  if (!apiHost) {
    throw new Error("API_HOST is required");
  }
  return apiHost;
};
