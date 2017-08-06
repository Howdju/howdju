import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import FontIcon from 'react-md/lib/FontIcons'
import moment from 'moment'

import paths from './paths'
import config from './config'

export default class StatementCard extends Component {

  render () {
    const {
      statement,
      ...rest,
    } = this.props
    const age = statement.created ? moment(statement.created).fromNow() : ''
    // const age = moment.duration(moment(s.created).diff(now)).humanize(true)
    const created = statement.created ? moment(statement.created).format(config.humanDateTimeFormat) : ''
    return (
        <Card {...rest}>
          <CardTitle
              avatar={<FontIcon role="presentation">short_text</FontIcon>}
              title={
                <Link to={paths.statement(statement)}>
                  {statement.text}
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
StatementCard.propTypes = {
  statement: PropTypes.object.isRequired,
}