import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import CardTitle from 'react-md/lib/Cards/CardTitle'

import paths from './paths'
import StatementJustifications from "./StatementJustifications";

export default class PerspectiveCard extends Component {

  render () {
    const {
      perspective,
    } = this.props

    return (
        <Card>
          <CardTitle title={
            <Link to={paths.statement(perspective.statement)}>
              {perspective.statement.text}
            </Link>
          } />
          <StatementJustifications statement={perspective.statement}
                                   WrapperComponent={CardText}
                                   doShowControls={false}
                                   doShowJustifications={true}
                                   isCondensed={true}
          />
        </Card>
    )
  }
}
PerspectiveCard.propTypes = {
  perspective: PropTypes.object.isRequired,
}