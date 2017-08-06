import React, {Component} from "react";
import {connect} from "react-redux";
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import map from 'lodash/map'
import get from 'lodash/get'
import queryString from 'query-string'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions";
import JustificationCard from "./JustificationCard";
import {denormalize} from "normalizr";
import {justificationsSchema} from "./schemas";

class JustificationsSearchPage extends Component {

  componentWillMount() {
    this.props.ui.clearJustificationsSearch()
    const {
      citationReferenceId,
      citationId,
      statementCompoundId,
      statementId,
    } = queryString.parse(window.location.search)
    const count = JustificationsSearchPage.fetchCount
    this.props.api.fetchJustificationsSearch({citationReferenceId, citationId, statementCompoundId, statementId, count})
  }

  fetchMore = event => {
    event.preventDefault()
    const {
      citationReferenceId,
      citationId,
      statementCompoundId,
      statementId,
    } = queryString.parse(window.location.search)
    const count = JustificationsSearchPage.fetchCount
    const {continuationToken} = this.props
    this.props.api.fetchMoreJustificationsSearch({citationReferenceId, citationId, statementCompoundId, statementId, count, continuationToken})
  }

  render() {
    const {
      isFetching,
      justifications,
    } = this.props

    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMore}
    />
    return (
        <div className="md-grid">
          <h1 className="md-cell md-cell--12">Justifications</h1>
          {justifications && justifications.length > 0 ?
              map(justifications, j => (
                <JustificationCard className="md-cell md-cell--12"
                                   key={`justification-card-${j.id}`}
                                   justification={j}
                />
            )) :
            <div className="md-cell md-cell--12 text-center">
              No justifications
            </div>
          }
          {isFetching && (
              <div className="md-cell md-cell--12 cell--centered-contents">
                <CircularProgress id={`$justificationsSearchPage-Progress`} />
              </div>
          )}
          <div className="md-cell md-cell--12 cell--centered-contents">
            {fetchMoreButton}
          </div>
        </div>
    )
  }
}
JustificationsSearchPage.fetchCount = 20

const mapStateToProps = (state, ownProps) => {
  const pageState = get(state, ['ui', 'justificationsSearchPage'], {})
  const {
    isFetching
  } = pageState
  const justifications = denormalize(pageState.justifications, justificationsSchema, state.entities)
  return {
    isFetching,
    justifications,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(JustificationsSearchPage)
