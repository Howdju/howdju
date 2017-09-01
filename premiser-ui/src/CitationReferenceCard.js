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
  truncateCitationReferenceQuote,
  isTextLong
} from "./viewModels"
import paths from './paths'
import {default as t} from './texts'
import * as characters from './characters'

import './CitationReferenceCard.scss'

export default class CitationReferenceCard extends Component {

  render () {
    const {
      citationReference,
      className,
      isExpanded,
      onExpand,
      onCollapse,
      ...rest,
    } = this.props
    const citation = citationReference.citation
    const age = citationReference.created ? moment(citationReference.created).fromNow() : ''
    const created = citationReference.created ? moment(citationReference.created).format(config.humanDateTimeFormat) : ''
    const _isQuoteLong = isTextLong(citationReference.quote)
    const quote = !_isQuoteLong || isExpanded ?
      citationReference.quote :
      truncateCitationReferenceQuote(citationReference.quote, {omission: ''})
    return (
      <Card {...rest}
            className={cn(className, "citation-reference-card")}
      >
        <CardTitle
          avatar={<FontIcon role="presentation">book</FontIcon>}
          title={
            <Link to={paths.citationReferenceUsages(citation)}>
              {citation.text}
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
        </CardText>
      </Card>
    )
  }
}
CitationReferenceCard.propTypes = {
  citationReference: PropTypes.object.isRequired,
}