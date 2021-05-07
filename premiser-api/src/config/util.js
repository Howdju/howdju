exports.apiHost = () => {
  let apiHost = process.env['API_HOST']
  if (!apiHost) {
    throw new Error("API_HOST is required")
  }
  return apiHost
}

exports.devWebServerPort = () => {
  return process.env['DEV_WEB_SERVER_PORT'] || 3000
}

exports.devApiServerPort = () => {
  return process.env['DEV_API_SERVER_PORT'] || 8081
}
