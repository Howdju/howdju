import React from 'react'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import map from 'lodash/map'
import cn from 'classnames'

import {
  truncateCitationReferenceQuote,
  isTextLong,
} from "./viewModels"
import {extractDomain} from "./util"
import * as characters from './characters'
import {default as t} from './texts'

import './CitationReferenceViewer.scss'


const CitationReferenceViewer = props => {
  const {
    citationReference,
    // doShowControls,
    isExpanded,
    onExpand,
    onCollapse,
  } = props

  const urls = map(citationReference.urls, u => {
    const id = `url-${u.id}-list-item`
    return (
      <li id={id} key={id} className="url">
        <a href={u.url}
           target="_blank"
           rel="noopener"
        >
          {extractDomain(u.url)}
          <FontIcon>open_in_new</FontIcon>
        </a>
      </li>
    )
  })

  const _isQuoteLong = isTextLong(citationReference.quote)
  const hasQuote = !!citationReference.quote
  const quote = !_isQuoteLong || isExpanded ?
    citationReference.quote :
    truncateCitationReferenceQuote(citationReference.quote, {omission: ''})

  return (
    <div className="citation-reference-viewer">
      <div className={cn("quote", {
        hidden: !hasQuote
      })}>
        <div className="quote-text-wrapper">
          <span className="quote-text">
            {quote}
            {_isQuoteLong && !isExpanded && <span className="clickable" onClick={onExpand}>{characters.ellipsis}</span>}
          </span>
        </div>
        {_isQuoteLong && !isExpanded && (
          <Button flat
                  label={t('More')}
                  className="text-expand-toggle"
                  onClick={onExpand}
          />
        )}
        {_isQuoteLong && isExpanded && (
          <Button flat
                  label={t('Less')}
                  className="text-expand-toggle"
                  onClick={onCollapse}
          />
        )}
      </div>
      <div className="citation-title">{citationReference.citation.text}</div>
      <ul className="citation-reference-urls">
        {urls}
      </ul>
    </div>
  )
}
export default CitationReferenceViewer