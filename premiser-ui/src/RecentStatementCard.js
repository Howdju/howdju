import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import moment from 'moment'

import paths from './paths'
import config from './config'

export default class RecentStatementCard extends Component {

  render () {
    const {
      statement,
    } = this.props
    const age = statement.created ? moment(statement.created).fromNow() : ''
    // const age = moment.duration(moment(s.created).diff(now)).humanize(true)
    const created = statement.created ? moment(statement.created).format(config.humanDateTimeFormat) : ''
    return (
        <Card className="md-cell md-cell--3">
          <CardText style={{fontSize: '1rem', lineHeight: '1.8rem'}}>
            <Link to={paths.statement(statement)}
                  style={{textDecoration: 'none'}}
            >
              {statement.text}
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
RecentStatementCard.propTypes = {
  statement: PropTypes.object.isRequired,
}