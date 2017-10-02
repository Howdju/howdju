import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import cn from 'classnames'

import WritEntityViewer from './WritEntityViewer'

export default class WritCard extends Component {

  render () {
    const {
      id,
      writ,
      className,
      ...rest,
    } = this.props
    return (
      <Card {...rest}
            className={cn(className, "entity-card")}
      >
        <CardText>
          <WritEntityViewer
            id={id}
            writ={writ}
          />
        </CardText>
      </Card>
    )
  }
}
WritCard.propTypes = {
  writ: PropTypes.object.isRequired,
}