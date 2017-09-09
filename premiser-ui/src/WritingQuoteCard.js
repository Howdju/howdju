import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import CardText from 'react-md/lib/Cards/CardText'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import moment from 'moment'
import cn from 'classnames'

import config from './config'
import {
  truncateWritingQuoteText,
  isTextLong
} from "./viewModels"
import paths from './paths'
import {default as t} from './texts'
import * as characters from './characters'

import './WritingQuoteCard.scss'

export default class WritingQuoteCard extends Component {

  render () {
    const {
      writingQuote,
      className,
      isExpanded,
      onExpand,
      onCollapse,
      ...rest,
    } = this.props
    const writing = writingQuote.writing
    const age = writingQuote.created ? moment(writingQuote.created).fromNow() : ''
    const created = writingQuote.created ? moment(writingQuote.created).format(config.humanDateTimeFormat) : ''
    const _isQuoteTextLong = isTextLong(writingQuote.quoteText)
    const quoteText = !_isQuoteTextLong || isExpanded ?
      writingQuote.quoteText :
      truncateWritingQuoteText(writingQuote.quoteText, {omission: ''})
    return (
      <Card {...rest}
            className={cn(className, "writing-quote-card")}
      >
        <CardTitle
          avatar={<FontIcon role="presentation">book</FontIcon>}
          title={
            <Link to={paths.writingQuoteUsages(writing)}>
              {writing.title}
            </Link>
          }
          subtitle={
            <span className="recent-statement-status-text">
              created <span title={created}>{age}</span>
            </span>
          }
        />
        <CardText className="card-quote">
          <div className="quote">
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
        </CardText>
      </Card>
    )
  }
}
WritingQuoteCard.propTypes = {
  writingQuote: PropTypes.object.isRequired,
}