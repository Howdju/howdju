import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'

import JustificationsTree from "./JustificationsTree"
import StatementEntityViewer from './StatementEntityViewer'

export default class PerspectiveCard extends Component {

  render () {
    const {
      id,
      perspective,
    } = this.props

    const justifications = perspective.statement.justifications
    return (
      <Card>
        <CardText>
          <StatementEntityViewer
            id={`${id}--statement`}
            statement={perspective.statement}
          />
        </CardText>
        <JustificationsTree
          justifications={justifications}
          doShowControls={false}
          doShowJustifications={true}
          WrapperComponent={CardText}
          showBasisUrls={false}
        />

      </Card>
    )
  }
}
PerspectiveCard.propTypes = {
  perspective: PropTypes.object.isRequired,
}
