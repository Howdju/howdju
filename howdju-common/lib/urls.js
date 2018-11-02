module.exports.extractDomain = function extractDomain(url) {

  let domain = null
  if (!url) {
    return domain
  }

  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2]
  }
  else {
    domain = url.split('/')[0]
  }

  //find & remove port number
  domain = domain.split(':')[0]

  return domain
}
