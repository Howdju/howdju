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
  const schema = 'https'
  const host = 'www.howdju.com'
  const port = 80
  let portString = ''
  if (schema === 'http' && port !== 80 || schema === 'https' && port !== 443) {
    portString = `:${port}`
  }
  const submitUrl = `${schema}://${host}${portString}/submit?${queryParamsString}`
  window.open(submitUrl)
})()