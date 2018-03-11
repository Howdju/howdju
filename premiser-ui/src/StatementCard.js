import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {Card, CardText} from 'react-md'
import cn from 'classnames'

import StatementEntityViewer from './StatementEntityViewer'


export default class StatementCard extends Component {

  render () {
    const {
      id,
      statement,
      showStatusText,
      className,
      ...rest,
    } = this.props
    return (
      <Card
        {...rest}
        className={cn(className, 'entity-card')}
      >
        <CardText>
          <StatementEntityViewer
            id={id}
            statement={statement}
            showStatusText={showStatusText}
          />
        </CardText>
      </Card>
    )
  }
}
StatementCard.propTypes = {
  id: PropTypes.string.isRequired,
  statement: PropTypes.object.isRequired,
}
