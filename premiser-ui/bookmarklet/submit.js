(() => {
  const encode = (val) => window.encodeURIComponent(val)
  const document = window.document
  const params = {
    url: window.location.href,
    description: document.title,
    quote: window.getSelection()||document.getSelection||document.getSelection()||document.selection||document.selection.createRange().text,
    source: 'bookmarklet-v1'
  }
  const queryParams = []
  for (let param in params) {
    if (params.hasOwnProperty(param)) {
      queryParams.push(`${param}=${encode(params[param])}`)
    }
  }
  const queryParamsString = queryParams.join('&')
  const schema = 'http'
  const host = 'localhost'
  const port = 3000
  const submitUrl = `${schema}://${host}:${port}/submit?${queryParamsString}`
  window.open(submitUrl)
})()