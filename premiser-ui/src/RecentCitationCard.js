import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import moment from 'moment'

import paths from './paths'
import config from './config'

export default class RecentCitationCard extends Component {

  render () {
    const {
      citation,
    } = this.props
    const age = citation.created ? moment(citation.created).fromNow() : ''
    const created = citation.created ? moment(citation.created).format(config.humanDateTimeFormat) : ''
    return (
        <Card className="md-cell md-cell--3">
          <CardText style={{fontSize: '1rem', lineHeight: '1.8rem'}}>
            <Link to={paths.citationUsages(citation)}
                  style={{textDecoration: 'none'}}
            >
              {citation.text}
            </Link>
            {' '}
            <p style={{marginTop: '0.8em'}}>
              created <span title={created}>{age}</span>
            </p>
          </CardText>
        </Card>
    )
  }
}
RecentCitationCard.propTypes = {
  citation: PropTypes.object.isRequired,
}