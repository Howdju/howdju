import React  from 'react'
import {Button} from 'react-md'

const ToolsPage = (props) => {
  const bookmarklet = `(function(h,o,w,d,j,u){d=h.createElement(o),j=h.getElementsByTagName(o)[0];d.async=1;d.src=w;j.parentNode.insertBefore(d,j)})(document,'script','https://cdn.howdju.com/submit.js')`
  const bookmarkletHref = 'javascript:' + bookmarklet
  return (
    <div className="md-grid">
      <div className="md-cell md-cell--12">
        <h1>Tools</h1>
      </div>
      <div className="md-cell md-cell--12">
        <h2>Chrome Extension</h2>
        <p>
          <a href="https://chrome.google.com/webstore/detail/howdju-extension/gijlmlebhfiglpgdlgphbmaamhkchoei/">
            Howdju Chrome Extension
          </a>
        </p>
      </div>
      <div className="md-cell md-cell--12">
        <h2>Bookmarklet</h2>
        <p>
          Use this bookmarklet to submit selected text on any page as a new quote justification.
        </p>
        <Button
          raised
          secondary
          component="a"
          title="Submit to Howdju"
          href={bookmarkletHref}
          children="+Howdju"
        />
        <p></p>
        <p>
          Raw bookmarklet code for copy/paste:
        </p>
        <textarea value={bookmarkletHref} readOnly>
        </textarea>

      </div>
    </div>
  )
}

export default ToolsPage
