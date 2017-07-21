import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {citationsSchema, statementsSchema} from "./schemas";
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'

import RecentCitationCard from './RecentCitationCard'

import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class RecentCitations extends Component {

  componentWillMount() {
    if (!this.props.continuationToken) {
      this.props.api.fetchRecentCitations(this.props.widgetId, this.props.initialFetchCount || this.props.fetchCount)
    }
  }

  fetchMoreRecentCitations = event => {
    event.preventDefault()
    this.props.api.fetchMoreRecentCitations(this.props.widgetId, this.props.continuationToken, this.props.fetchCount)
  }

  render () {
    const {
      citations,
    } = this.props
    const cards = () => map(citations, c => {
      const id = `recent-statement-${c.id}`
      return <RecentCitationCard key={id} citation={c} />
    })
    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMoreRecentCitations}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    return (
        <FlipMove id="recentCitations"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
                  className="md-grid"
        >
          {citations && citations.length > 0 ?
              concat(cards(), fetchMoreButton) :
              <div>No recent citations.</div>
          }
        </FlipMove>
    )
  }
}
RecentCitations.propTypes = {
  widgetId: PropTypes.string.isRequired,
  fetchCount: PropTypes.number.isRequired,
  /** If defined, the number of statements to fetch the first time */
  initialFetchCount: PropTypes.number,
  onStatementsLengthChange: PropTypes.func,
}
RecentCitations.defaultProps = {
  initialFetchCount: 7,
  fetchCount: 8,
}
const mapStateToProps = (state, ownProps) => {
  const widgetState = get(state, ['widgets', ownProps.widgetId], {})
  const citations = denormalize(widgetState.recentCitations, citationsSchema, state.entities)
  const {
    continuationToken,
  } = widgetState
  return {
    citations,
    continuationToken,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
}))(RecentCitations)