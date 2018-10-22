import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {Card, CardText} from 'react-md'

import JustificationsTree from "./JustificationsTree"
import PropositionEntityViewer from './PropositionEntityViewer'

export default class PerspectiveCard extends Component {

  render () {
    const {
      id,
      perspective,
    } = this.props

    const justifications = perspective.proposition.justifications
    return (
      <Card>
        <CardText>
          <PropositionEntityViewer
            id={`${id}--proposition`}
            proposition={perspective.proposition}
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
