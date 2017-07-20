import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import map from 'lodash/map'

import JustificationWithCounters from './JustificationWithCounters'
import {isPositive} from './models'

export default class PerspectiveCard extends Component {

  render () {
    const {
      perspective,
    } = this.props
    return (
        <Card>
          <CardTitle title={perspective.statement.text} />
          <CardText>
            {map(perspective.justifications, j => {
              const id = `justification-${j.id}`
              return <JustificationWithCounters key={id}
                                                justification={j}
                                                positivey={isPositive(j)}
                                                showControls={false}
              />
            }
            )}
          </CardText>
        </Card>
    )
  }
}
PerspectiveCard.propTypes = {
  perspective: PropTypes.object.isRequired,
}