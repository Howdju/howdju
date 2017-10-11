import React  from 'react'
import Button from 'react-md/lib/Buttons/Button'

const ToolsPage = (props) => {
  const bookmarklet = `(function(h,o,w,d,j,u){d=h.createElement(o),j=h.getElementsByTagName(o)[0];d.async=1;d.src=w;j.parentNode.insertBefore(d,j)})(document,'script','https://cdn.howdju.com/submit.js')`
  return (
    <div className="md-grid">
      <div className="md-cell md-cell--12">
        <h1>Tools</h1>
      </div>
      <div className="md-cell md-cell--12">
        <p>
          Use this bookmarklet to submit selected text on any page as a new quote justification.
        </p>
        <Button
          raised
          secondary
          component="a"
          title="Submit to Howdju"
          href={'javascript:' + bookmarklet}
          label="+Howdju"
        />

      </div>
    </div>
  )
}

export default ToolsPage
