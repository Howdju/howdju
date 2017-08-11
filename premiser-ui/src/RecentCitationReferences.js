import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {citationReferencesSchema} from "./schemas";
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'

import CitationReferenceCard from './CitationReferenceCard'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class RecentCitationReferences extends Component {

  componentWillMount() {
    this.props.ui.clearRecentCitationReferences(this.props.widgetId)
    this.props.api.fetchRecentCitationReferences(this.props.widgetId, this.props.initialFetchCount || this.props.fetchCount)
  }

  fetchMoreRecentCitationReferences = event => {
    event.preventDefault()
    this.props.api.fetchRecentCitationReferences(this.props.widgetId, this.props.fetchCount, this.props.continuationToken)
  }

  render () {
    const {
      citationReferences,
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
    const hasCitationReferences = citationReferences && citationReferences.length > 0
    const cards = () => map(citationReferences, cr => {
      const id = `recent-citation-reference-${cr.id}`
      return <CitationReferenceCard key={id} citationReference={cr} className="md-cell md-cell--3 md-cell--8-tablet md-cell--4-phone" />
    })
    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMoreRecentCitationReferences}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui

    return (
        <div>
          <FlipMove {...rest}
                    id="recentCitations"
                    duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {hasCitationReferences &&
              concat(cards(), fetchMoreButton)
            }
          </FlipMove>
          <FlipMove duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {!hasCitationReferences &&
              <div className="md-cell md-cell--12">No recent citations.</div>
            }
          </FlipMove>
        </div>
    )
  }
}
RecentCitationReferences.propTypes = {
  widgetId: PropTypes.string.isRequired,
  fetchCount: PropTypes.number.isRequired,
  /** If defined, the number of statements to fetch the first time */
  initialFetchCount: PropTypes.number,
  onStatementsLengthChange: PropTypes.func,
}
RecentCitationReferences.defaultProps = {
  initialFetchCount: 7,
  fetchCount: 8,
}
const mapStateToProps = (state, ownProps) => {
  const widgetState = get(state, ['widgets', ownProps.widgetId], {})
  const citationReferences = denormalize(widgetState.recentCitationReferences, citationReferencesSchema, state.entities)
  const {
    continuationToken,
  } = widgetState
  return {
    citationReferences,
    continuationToken,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(RecentCitationReferences)