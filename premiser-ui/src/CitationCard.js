import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import FontIcon from 'react-md/lib/FontIcons'
import moment from 'moment'

import paths from './paths'
import config from './config'

export default class CitationCard extends Component {

  render () {
    const {
      citation,
      ...rest,
    } = this.props
    const age = citation.created ? moment(citation.created).fromNow() : ''
    const created = citation.created ? moment(citation.created).format(config.humanDateTimeFormat) : ''
    return (
        <Card {...rest}>
          <CardTitle
              avatar={<FontIcon role="presentation">book</FontIcon>}
              title={
                <Link to={paths.citationUsages(citation)}>
                  {citation.text}
                </Link>
              }
              subtitle={
                <span className="recent-statement-status-text">
                  created <span title={created}>{age}</span>
                </span>
              }
          />
        </Card>
    )
  }
}
CitationCard.propTypes = {
  citation: PropTypes.object.isRequired,
}