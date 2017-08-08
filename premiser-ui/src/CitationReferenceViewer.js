import React from 'react'
import map from 'lodash/map'
import FontIcon from 'react-md/lib/FontIcons'
import cn from 'classnames'

import {truncateCitationReferenceQuote} from "./models";
import {extractDomain} from "./util"

import './CitationReferenceViewer.scss'


export default props => {
  const {
    citationReference,
    doShowControls,
  } = props

  const urls = map(citationReference.urls, u => {
    const id = `url-${u.id}-list-item`
    return (
        <li id={id} key={id} className="url">
          <a href={u.url}
             target="_blank"
          >
            {extractDomain(u.url)}
            <FontIcon>open_in_new</FontIcon>
          </a>
        </li>
    )
  })


  return (
      <div className="citation-reference-viewer">
        <div className={cn("quote", {
          hidden: !citationReference.quote
        })}>
          <span className="quote-text">{truncateCitationReferenceQuote(citationReference.quote)}</span>
        </div>
        <div className="citation-title">{citationReference.citation.text}</div>
        <ul className="citation-reference-urls">
          {urls}
        </ul>
      </div>
  )
}