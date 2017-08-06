import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import CardText from 'react-md/lib/Cards/CardText'
import FontIcon from 'react-md/lib/FontIcons'
import moment from 'moment'

import config from './config'
import {truncateCitationReferenceQuote} from "./models";
import paths from './paths'

export default class CitationReferenceCard extends Component {

  render () {
    const {
      citationReference,
      ...rest,
    } = this.props
    const citation = citationReference.citation
    const age = citationReference.created ? moment(citationReference.created).fromNow() : ''
    const created = citationReference.created ? moment(citationReference.created).format(config.humanDateTimeFormat) : ''
    return (
        <Card {...rest}>
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
          <CardText>
            {truncateCitationReferenceQuote(citationReference.quote)}
          </CardText>
        </Card>
    )
  }
}
CitationReferenceCard.propTypes = {
  citationReference: PropTypes.object.isRequired,
}