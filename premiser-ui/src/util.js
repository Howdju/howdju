export function extractDomain(url) {
  let domain;
  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  return domain;
}

const API_ROOT = 'http://localhost:8081/api/'
// https://ewl0mezq3f.execute-api.us-east-1.amazonaws.com/dev/api/

export function apiUrl(path) {
  return API_ROOT + path;
}