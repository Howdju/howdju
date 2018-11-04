import React, { Component } from 'react'
import FlipMove from 'react-flip-move'
import { connect } from 'react-redux'
import {CircularProgress} from 'react-md'
import get from 'lodash/get'
import {denormalize} from "normalizr"
import map from 'lodash/map'

import {perspectivesSchema} from "./normalizationSchemas"

import PerspectiveCard from './PerspectiveCard'
import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import config from './config'

class FeaturedPerspectivesPage extends Component {

  componentWillMount() {
    this.props.api.fetchFeaturedPerspectives(this.props.widgetId)
  }

  render () {
    const {
      perspectives,
      isFetching,
    } = this.props
    const flipMoveProps = config.ui.flipMove

    const hasPerspectives = perspectives && perspectives.length > 0

    return (
      <div id="featuredPerspectives">
        <div className="md-grid">
          <FlipMove
            {...flipMoveProps}
            className="md-cell md-cell--12 center-text"
          >
            {map(perspectives, p => {
              const id = `featured-perspective-${p.id}`
              return (
                <PerspectiveCard
                  id={id}
                  key={id}
                  perspective={p}
                />
              )
            })}
          </FlipMove>

          {isFetching && (
            <CircularProgress key="progress" id="featured-perspectives-progress" />
          )}
          {!isFetching && !hasPerspectives && (
            <div key="no-featured-perspectives-message" className="md-cell md-cell--12 center-text">
              No featured perspectives
            </div>
          )}
        </div>
      </div>
    )
  }
}
const mapStateToProps = (state, ownProps) => {
  const pageState = get(state, ['ui', 'featuredPerspectivesPage'], {})
  const perspectives = denormalize(pageState.featuredPerspectives, perspectivesSchema, state.entities)
  const {
    continuationToken,
    isFetching,
  } = pageState
  return {
    perspectives,
    continuationToken,
    isFetching,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
}))(FeaturedPerspectivesPage)