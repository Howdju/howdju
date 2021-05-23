import React, {Component} from "react"
import FlipMove from 'react-flip-move'
import {connect} from "react-redux"
import {Button, CircularProgress} from 'react-md'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import queryString from 'query-string'
import {denormalize} from "normalizr"

import {
  ValidJustificationSearchFilters
} from 'howdju-common'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import JustificationCard from "./JustificationCard"
import {justificationsSchema} from "./normalizationSchemas"
import config from './config'
import {extensionHighlightingOnClickWritQuoteUrl} from "./OnClickWritQuoteUrl"
import {actions} from "howdju-client-common"


class JustificationsSearchPage extends Component {
  static fetchCount = 20

  constructor() {
    super()
    this.onClickWritQuoteUrl = extensionHighlightingOnClickWritQuoteUrl.bind(this)
  }

  static extractIncludeUrls = (locationSearch) =>
    get(queryString.parse(locationSearch), 'includeUrls')

  static filters = (locationSearch) =>
    pick(queryString.parse(locationSearch), ValidJustificationSearchFilters)

  componentDidMount() {
    const filters = JustificationsSearchPage.filters(this.props.location.search)
    const includeUrls = JustificationsSearchPage.extractIncludeUrls(this.props.location.search)
    this.refreshResults(filters, includeUrls)
  }

  componentDidUpdate(prevProps) {
    const prevFilters = JustificationsSearchPage.filters(prevProps.location.search)
    const filters = JustificationsSearchPage.filters(this.props.location.search)
    const prevIncludeUrls = JustificationsSearchPage.extractIncludeUrls(prevProps.location.search)
    const includeUrls = JustificationsSearchPage.extractIncludeUrls(this.props.location.search)
    if (!isEqual(prevFilters, filters) || includeUrls !== prevIncludeUrls) {
      this.refreshResults(filters, includeUrls)
    }
  }

  fetchMore = event => {
    event.preventDefault()
    const filters = JustificationsSearchPage.filters(this.props.location.search)
    const includeUrls = JustificationsSearchPage.extractIncludeUrls(this.props.location.search)
    const count = JustificationsSearchPage.fetchCount
    const {continuationToken} = this.props
    this.props.api.fetchJustificationsSearch({filters, includeUrls, count, continuationToken})
  }

  refreshResults = (filters, includeUrls) => {
    const count = JustificationsSearchPage.fetchCount
    this.props.api.fetchJustificationsSearch({filters, includeUrls, count})
  }

  render() {
    const {
      isFetching,
      justifications,
    } = this.props

    const hasJustifications = justifications && justifications.length > 0

    const fetchMoreButton = (
      <Button flat
              key="fetch-more-button"
              children="Fetch more"
              disabled={isFetching}
              onClick={this.fetchMore}
      />
    )

    const filters = JustificationsSearchPage.filters(this.props.location.search)
    const filtersList = isEmpty(filters) ? null : (
      <ul className="md-cell md-cell--12">
        {map(filters, (val, key) => (
          <li><strong>{key}</strong>: {val}</li>
        ))}
      </ul>
    )

    return (
      <div className="md-grid">
        <h1 className="md-cell md-cell--12">Justifications</h1>

        {filtersList && (
          <>
            <h2 className="md-cell md-cell--12">Filters</h2>
            {filtersList}
          </>
        )}

        <FlipMove
          {...config.ui.flipMove}
          className="md-cell md-cell--12 center-text"

        >
          {map(justifications, j => {
            const id = `justification-card-${j.id}`
            return (
              <JustificationCard
                className="md-cell md-cell--12"
                id={id}
                key={id}
                justification={j}
                showBasisUrls={true}
                onClickWritQuoteUrl={this.onClickWritQuoteUrl}
              />
            )
          })}
        </FlipMove>
        {!isFetching && !hasJustifications && (
          <div className="md-cell md-cell--12 text-center">
            No justifications
          </div>
        )}
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
  extension: actions.extension,
  ui,
}))(JustificationsSearchPage)
