import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import FontIcon from 'react-md/lib/FontIcons'
import moment from 'moment'
import cn from 'classnames'

import paths from './paths'
import config from './config'

export default class WritCard extends Component {

  render () {
    const {
      writ,
      className,
      ...rest,
    } = this.props
    const age = writ.created ? moment(writ.created).fromNow() : ''
    const created = writ.created ? moment(writ.created).format(config.humanDateTimeFormat) : ''
    return (
      <Card {...rest}
            className={cn(className, "writ-card")}
      >
        <CardTitle
          avatar={<FontIcon role="presentation">book</FontIcon>}
          title={
            <Link to={paths.writUsages(writ)}>
              {writ.title}
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
WritCard.propTypes = {
  writ: PropTypes.object.isRequired,
}