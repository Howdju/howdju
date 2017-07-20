import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import FlipMove from 'react-flip-move';
import map from 'lodash/map'
import moment from 'moment'

import paths from './paths'
import config from './config'

export default class RecentStatementsListItems extends Component {
  render () {
    const {
      recentStatements,
    } = this.props
    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications
    // const now = moment()
    const items = map(recentStatements, s => {
      const age = moment(s.created).fromNow()
      // const age = moment.duration(moment(s.created).diff(now)).humanize(true)
      const created = moment(s.created).format(config.humanDateTimeFormat)
      return (
          <li key={`statement-${s.id}`}>
            <Link to={paths.statement(s)}>{s.text}</Link>
            {' '}
            <span title={created}>
              ({age})
            </span>
          </li>
      )
    })
    return (
        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing} typeName="ul">
          {items}
        </FlipMove>
    )
  }
}
RecentStatementsListItems.propTypes = {
  recentStatements: PropTypes.arrayOf(PropTypes.object).isRequired,
}