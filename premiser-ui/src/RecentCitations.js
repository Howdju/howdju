import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {citationsSchema} from "./schemas";
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'

import CitationCard from './CitationCard'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class RecentCitations extends Component {

  componentWillMount() {
    this.props.ui.clearRecentCitations(this.props.widgetId)
    this.props.api.fetchRecentCitations(this.props.widgetId, this.props.initialFetchCount || this.props.fetchCount)
  }

  fetchMoreRecentCitations = event => {
    event.preventDefault()
    this.props.api.fetchMoreRecentCitationReferences(this.props.widgetId, this.props.continuationToken, this.props.fetchCount)
  }

  render () {
    const {
      citations,
      // ignore
      widgetId,
      continuationToken,
      api,
      ui,
      initialFetchCount,
      fetchCount,
      // end-ignore
      ...rest,
    } = this.props
    const cards = () => map(citations, c => {
      const id = `recent-citation-${c.id}`
      return <CitationCard key={id} citation={c} className="md-cell md-cell--3 md-cell--4-tablet" />
    })
    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMoreRecentCitations}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    return (
        <FlipMove {...rest}
                  id="recentCitations"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
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
  ui,
}))(RecentCitations)