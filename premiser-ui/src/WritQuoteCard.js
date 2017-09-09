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
  truncateWritQuoteText,
  isTextLong
} from "./viewModels"
import paths from './paths'
import t from './texts'
import * as characters from './characters'

import './WritQuoteCard.scss'

export default class WritQuoteCard extends Component {

  render () {
    const {
      writQuote,
      className,
      isExpanded,
      onExpand,
      onCollapse,
      ...rest,
    } = this.props
    const writ = writQuote.writ
    const age = writQuote.created ? moment(writQuote.created).fromNow() : ''
    const created = writQuote.created ? moment(writQuote.created).format(config.humanDateTimeFormat) : ''
    const _isQuoteTextLong = isTextLong(writQuote.quoteText)
    const quoteText = !_isQuoteTextLong || isExpanded ?
      writQuote.quoteText :
      truncateWritQuoteText(writQuote.quoteText, {omission: ''})
    return (
      <Card {...rest}
            className={cn(className, "writ-quote-card")}
      >
        <CardTitle
          avatar={<FontIcon role="presentation">book</FontIcon>}
          title={
            <Link to={paths.writQuoteUsages(writ)}>
              {writ.title}
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
WritQuoteCard.propTypes = {
  writQuote: PropTypes.object.isRequired,
}