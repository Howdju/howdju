import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {citationsSchema, justificationsSchema, statementsSchema} from "./schemas";
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'

import RecentCitationCard from './RecentCitationCard'

import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import JustificationCard from "./JustificationCard";

class RecentJustifications extends Component {

  componentWillMount() {
    if (!this.props.continuationToken) {
      this.props.api.fetchRecentJustifications(this.props.widgetId, this.props.initialFetchCount || this.props.fetchCount)
    }
  }

  fetchMoreRecentJustifications = event => {
    event.preventDefault()
    this.props.api.fetchMoreRecentJustifications(this.props.widgetId, this.props.continuationToken, this.props.fetchCount)
  }

  render () {
    const {
      justifications,
    } = this.props
    const cards = () => map(justifications, j => {
      const id = `recent-statement-${j.id}`
      return <JustificationCard key={id} justification={j} />
    })
    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMoreRecentJustifications}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    return (
        <FlipMove id="recentJustifications"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
                  className="md-grid"
        >
          {justifications && justifications.length > 0 ?
              concat(cards(), fetchMoreButton) :
              <div>No recent justifications.</div>
          }
        </FlipMove>
    )
  }
}
RecentJustifications.propTypes = {
  widgetId: PropTypes.string.isRequired,
  fetchCount: PropTypes.number.isRequired,
  /** If defined, the number of statements to fetch the first time */
  initialFetchCount: PropTypes.number,
  onStatementsLengthChange: PropTypes.func,
}
RecentJustifications.defaultProps = {
  initialFetchCount: 7,
  fetchCount: 8,
}
const mapStateToProps = (state, ownProps) => {
  const widgetState = get(state, ['widgets', ownProps.widgetId], {})
  const justifications = denormalize(widgetState.recentJustifications, justificationsSchema, state.entities)
  const {
    continuationToken,
  } = widgetState
  return {
    justifications,
    continuationToken,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
}))(RecentJustifications)