
export function attachHeadersListener({
  webRequest,
  hosts,
  iframeHosts,
  overrideFrameOptions,
  isDevelopment,
}) {
  if (typeof hosts !== 'string') {
    if (hosts) {
      hosts = hosts.join(' ')
    } else {
      throw new Error('`hosts` option must be a string or array')
    }
  }

  if (typeof iframeHosts !== 'string') {
    if (iframeHosts) {
      iframeHosts = iframeHosts.join(' ')
    } else {
      throw new Error('`iframeHosts` option must be a string or array')
    }
  }

  const types  = ['main_frame']

  if (overrideFrameOptions) {
    types.push('sub_frame')
  }

  webRequest.onHeadersReceived.addListener(details => {
    const responseHeaders = details.responseHeaders.map(
      (header) => modifyHeader(header, hosts, iframeHosts, overrideFrameOptions, isDevelopment)
    )
    return { responseHeaders }
  }, {
    urls: ['http://*/*', 'https://*/*'],
    types
  }, [
    'blocking',
    'responseHeaders'
  ])
}

function modifyHeader(header, hosts, iframeHosts, overrideFrameOptions, isDevelopment) {
  const isCSPHeader = /content-security-policy/i.test(header.name)
  const isFrameHeader = /x-frame-options/i.test(header.name)

  if (isCSPHeader) {
    let csp = header.value

    csp = csp.replace('script-src', `script-src ${hosts}`)
    csp = csp.replace('style-src', `style-src ${hosts}`)
    csp = csp.replace('frame-src', `frame-src ${iframeHosts}`)
    csp = csp.replace('child-src', `child-src ${hosts}`)
    if (isDevelopment) {
      csp = csp.replace('block-all-mixed-content;', '')
      csp = csp.replace('upgrade-insecure-requests;', '')
    }

    if (overrideFrameOptions) {
      csp = csp.replace(/frame-ancestors (.*?);/ig, '')
    }

    header.value = csp
  } else if (isFrameHeader && overrideFrameOptions) {
    header.value = 'ALLOWALL'
  }

  return header
}
