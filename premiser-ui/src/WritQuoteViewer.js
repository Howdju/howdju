import React from 'react'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import map from 'lodash/map'
import cn from 'classnames'

import {
  truncateWritQuoteText,
  isTextLong,
} from "./viewModels"
import {extractDomain} from "./util"
import * as characters from './characters'
import t from './texts'

import './WritQuoteViewer.scss'


const WritQuoteViewer = props => {
  const {
    writQuote,
    // doShowControls,
    isExpanded,
    onExpand,
    onCollapse,
  } = props

  const urls = map(writQuote.urls, u => {
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

  const _isQuoteTextLong = isTextLong(writQuote.quoteText)
  const hasQuote = !!writQuote.quoteText
  const quoteText = !_isQuoteTextLong || isExpanded ?
    writQuote.quoteText :
    truncateWritQuoteText(writQuote.quoteText, {omission: ''})

  return (
    <div className="writ-quote-viewer">
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
      <div className="writ-title">{writQuote.writ.title}</div>
      <ul className="writ-quote-urls">
        {urls}
      </ul>
    </div>
  )
}
export default WritQuoteViewer