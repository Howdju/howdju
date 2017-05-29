import React from 'react'
import {extractDomain} from "./util"
import FontIcon from 'react-md/lib/FontIcons'

import './CitationReferenceViewer.scss'

export default props => {
  const {
    citationReference
  } = props

  const urls = citationReference.urls.map(u =>
      <li id={`url-${u.id}-list-item`} key={`url-${u.id}-list-item`} className="url">
        <a href={u.url}>
          {extractDomain(u.url)}
          <FontIcon>open_in_new</FontIcon>
        </a>
      </li>
  )

  return (
      <div className="citationReferenceViewer">
        <div className="quote">
          <span>{citationReference.quote}</span>
        </div>
        <div className="citationTitle">{citationReference.citation.text}</div>
        <ul>
          {urls}
        </ul>
      </div>
  )
}