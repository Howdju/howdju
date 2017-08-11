import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FlipMove from 'react-flip-move'
import { connect } from 'react-redux'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import get from 'lodash/get'
import {denormalize} from "normalizr";
import map from 'lodash/map'

import {perspectivesSchema} from "./schemas";

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
    } = this.props
    const {
      flipMoveDuration,
      flipMoveEasing
    } = config.ui

    return (
        <div id="featuredPerspectives">
          <div className="md-grid">
            <FlipMove className="md-cell md-cell--12 center-text"
                      duration={flipMoveDuration}
                      easing={flipMoveEasing}
            >
              {perspectives && perspectives.length > 0 ?
                  map(perspectives, p => {
                    const id = `featured-perspective-${p.id}`
                    return <PerspectiveCard key={id} perspective={p} />
                  }) :
                  <CircularProgress key="progress" id="statementJustificationsProgress" />
              }
            </FlipMove>
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
  } = pageState
  return {
    perspectives,
    continuationToken,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
}))(FeaturedPerspectivesPage)