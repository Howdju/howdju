import React, { Component, PropTypes } from 'react'

const ToolsPage = props => {
  const schema = 'https'
  const host = 'localhost'
  const port = 8081
  const version = 'v1'
  const submitUrl = `${schema}://${host}:${port}/api/${version}/submit-bookmarklet?`
  const href=`javascript:(function(){function enc(v){return window.encodeURIComponent(window.encodeURIComponent(v))} window.open('${submitUrl}'+'url='+enc(window.location)+'&amp;citationText='+document.title+'&amp;quote='+enc(window.getSelection()||document.getSelection&&document.getSelection()||document.selection&&document.selection.createRange().text)})();`
  return (
      <a title="Submit to Howdju" href={href}>+Howdju</a>
  )
}

export default ToolsPage