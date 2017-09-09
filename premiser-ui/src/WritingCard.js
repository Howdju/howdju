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

export default class WritingCard extends Component {

  render () {
    const {
      writing,
      className,
      ...rest,
    } = this.props
    const age = writing.created ? moment(writing.created).fromNow() : ''
    const created = writing.created ? moment(writing.created).format(config.humanDateTimeFormat) : ''
    return (
      <Card {...rest}
            className={cn(className, "writing-card")}
      >
        <CardTitle
          avatar={<FontIcon role="presentation">book</FontIcon>}
          title={
            <Link to={paths.writingUsages(writing)}>
              {writing.title}
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
WritingCard.propTypes = {
  writing: PropTypes.object.isRequired,
}