import React from 'react'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import map from 'lodash/map'
import cn from 'classnames'

import {
  truncateWritingQuoteText,
  isTextLong,
} from "./viewModels"
import {extractDomain} from "./util"
import * as characters from './characters'
import {default as t} from './texts'

import './WritingQuoteViewer.scss'


const WritingQuoteViewer = props => {
  const {
    writingQuote,
    // doShowControls,
    isExpanded,
    onExpand,
    onCollapse,
  } = props

  const urls = map(writingQuote.urls, u => {
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

  const _isQuoteTextLong = isTextLong(writingQuote.quoteText)
  const hasQuote = !!writingQuote.quoteText
  const quoteText = !_isQuoteTextLong || isExpanded ?
    writingQuote.quoteText :
    truncateWritingQuoteText(writingQuote.quoteText, {omission: ''})

  return (
    <div className="writing-quote-viewer">
      <div className={cn("quote", {
        hidden: !hasQuote
      })}>
        <div className="quote-text-wrapper">
          <span className="quote-text">
            {quoteText}
            {_isQuoteTextLong && !isExpanded && <span className="clickable" onClick={onExpand}>{characters.ellipsis}</span>}
          </span>
        </div>
        {_isQuoteTextLong && !isExpanded && (
          <Button flat
                  label={t('More')}
                  className="text-expand-toggle"
                  onClick={onExpand}
          />
        )}
        {_isQuoteTextLong && isExpanded && (
          <Button flat
                  label={t('Less')}
                  className="text-expand-toggle"
                  onClick={onCollapse}
          />
        )}
      </div>
      <div className="writing-title">{writingQuote.writing.title}</div>
      <ul className="writing-quote-urls">
        {urls}
      </ul>
    </div>
  )
}
export default WritingQuoteViewer