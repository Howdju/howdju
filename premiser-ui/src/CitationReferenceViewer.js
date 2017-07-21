import React from 'react'
import map from 'lodash/map'
import truncate from 'lodash/truncate'
import FontIcon from 'react-md/lib/FontIcons'
import cn from 'classnames'

import {extractDomain} from "./util"

import './CitationReferenceViewer.scss'

// '…'
const ellipsis = String.fromCharCode(8230)

export default props => {
  const {
    citationReference
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

  const truncateOptions = {
    length: 256,
    omission: ellipsis,
    separator: /\s+/,
  }

  return (
      <div className="citationReferenceViewer">
        <div className={cn({
          quote: true,
          hidden: !citationReference.quote
        })}>
          <span>{truncate(citationReference.quote, truncateOptions)}</span>
        </div>
        <div className="citationTitle">{citationReference.citation.text}</div>
        <ul>
          {urls}
        </ul>
      </div>
  )
}