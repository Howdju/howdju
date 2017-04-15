const encode = (val) => window.encodeURIComponent(window.encodeURIComponent(val))
const params = {
  url: location.href,
  description: document.title,
  quote: window.getSelection()||document.getSelection||document.getSelection()||document.selection||document.selection.createRange().text
}
const queryParams = []
for (let param of params) {
  if (params.hasOwnProperty(param)) {
    queryParams.append(`${param}=${encode(params[param])}`)
  }
}
const queryParamsString = queryParams.join('&amp;')
// TODO these should be static, whereas the above is calculated each time
const schema = 'https'
const host = 'localhost'
const port = 8081
const version = 'v1'
const submitUrl = `${schema}://${host}:${port}/api/${version}/submit-bookmarklet?${queryParamsString}`
window.open(submitUrl)