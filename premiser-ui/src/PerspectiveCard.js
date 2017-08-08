import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import CardTitle from 'react-md/lib/Cards/CardTitle'

import paths from './paths'
import StatementJustificationTrees from "./StatementJustificationTrees";

export default class PerspectiveCard extends Component {

  render () {
    const {
      perspective,
    } = this.props

    const justifications = perspective.statement.justifications
    return (
        <Card>
          <CardTitle title={
            <Link to={paths.statement(perspective.statement)}>
              {perspective.statement.text}
            </Link>
          } />
          <StatementJustificationTrees justifications={justifications}
                                           doShowControls={false}
                                           doShowJustifications={true}
                                           isCondensed={true}
                                           WrapperComponent={CardText}
          />

        </Card>
    )
  }
}
PerspectiveCard.propTypes = {
  perspective: PropTypes.object.isRequired,
}
