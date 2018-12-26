import React from "react"
import {connect} from "react-redux"
import {Button, CircularProgress} from 'react-md'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import queryString from 'query-string'
import {denormalize} from "normalizr"

import {
  SentenceType,
} from 'howdju-common'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import CellList from './CellList'
import {
  justificationsSchema,
  statementsSchema,
} from './normalizationSchemas'
import StatementCard from "./StatementCard"
import {combineIds} from './viewModels'
import FlipMove from 'react-flip-move'
import JustificationCard from './JustificationCard'
import config from './config'


class PropositionUsagesPage extends React.Component {

  static id = 'proposition-usages-page'
  static fetchCount = 20
  static propositionIdFromProps = (props) => get(queryString.parse(props.location.search), 'propositionId')

  propositionId = () => {
    return PropositionUsagesPage.propositionIdFromProps(this.props)
  }

  componentDidMount() {
    this.refreshResults(this.propositionId())
  }

  componentDidUpdate(prevProps) {
    const prevPropositionId = PropositionUsagesPage.propositionIdFromProps(prevProps)
    const propositionId = this.propositionId()
    if (!isEqual(propositionId, prevPropositionId)) {
      this.refreshResults(propositionId)
    }
  }

  refreshResults = (propositionId) => {
    this.props.api.fetchSentenceStatements(SentenceType.PROPOSITION, propositionId)
    this.props.api.fetchIndirectPropositionStatements(propositionId)
    const count = PropositionUsagesPage.fetchCount
    this.props.api.fetchJustificationsSearch({filters: {propositionId}, count})
    // later: fetchInternalPropositionAppearances/fetchExternalPropositionAppearances
  }

  fetchMoreJustifications = (event) => {
    event.preventDefault()
    const count = PropositionUsagesPage.fetchCount
    const propositionId = this.propositionId()
    const {continuationToken} = this.props
    this.props.api.fetchJustificationsSearch({filters: {propositionId}, count, continuationToken})
  }

  render() {
    const {
      isFetchingDirect,
      isFetchingIndirect,
      isFetchingJustifications,
      directStatements,
      indirectStatements,
      justifications,
    } = this.props

    const hasDirectStatements = directStatements && directStatements.length > 0
    const hasIndirectStatements = indirectStatements && indirectStatements.length > 0
    const hasJustifications = !isEmpty(justifications)

    const fetchMoreJustificationsButton = (
      <Button flat
              key="fetch-more-button"
              children="Fetch more"
              disabled={isFetchingJustifications}
              onClick={this.fetchMoreJustifications}
      />
    )

    return (
      <div className="md-grid">

        <h1 className="md-cell md-cell--12">Direct Statements</h1>
        <CellList
          className="md-cell md-cell--12 center-text"
        >
          {map(directStatements, s => {
            const id = combineIds(PropositionUsagesPage.id, 'statement', s.id)
            return (
              <StatementCard
                className="md-cell md-cell--12"
                id={id}
                key={id}
                statement={s}
              />
            )
          })}
        </CellList>
        {!isFetchingDirect && !hasDirectStatements && (
          <div className="md-cell md-cell--12 text-center">
            No direct statements
          </div>
        )}
        {isFetchingDirect && (
          <div className="md-cell md-cell--12 cell--centered-contents">
            <CircularProgress id={`$justificationsSearchPage-Progress`} />
          </div>
        )}

        <h1 className="md-cell md-cell--12">Indirect Statements</h1>
        <CellList
          className="md-cell md-cell--12 center-text"
        >
          {map(indirectStatements, s => {
            const id = combineIds(PropositionUsagesPage.id, 'statement', s.id)
            return (
              <StatementCard
                className="md-cell md-cell--12"
                id={id}
                key={id}
                statement={s}
              />
            )
          })}
        </CellList>
        {!isFetchingIndirect && !hasIndirectStatements && (
          <div className="md-cell md-cell--12 text-center">
            No indirect statements
          </div>
        )}
        {isFetchingIndirect && (
          <div className="md-cell md-cell--12 cell--centered-contents">
            <CircularProgress id={`$justificationsSearchPage-Progress`} />
          </div>
        )}

        <h1 className="md-cell md-cell--12">Justifications</h1>
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
              />
            )
          })}
        </FlipMove>
        {!isFetchingJustifications && !hasJustifications && (
          <div className="md-cell md-cell--12 text-center">
            No justifications
          </div>
        )}
        {isFetchingJustifications && (
          <div className="md-cell md-cell--12 cell--centered-contents">
            <CircularProgress id={`$justificationsSearchPage-Progress`} />
          </div>
        )}
        <div className="md-cell md-cell--12 cell--centered-contents">
          {fetchMoreJustificationsButton}
        </div>

      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const pageState = get(state, ['ui', 'propositionUsagesPage'], {})
  const {
    isFetchingDirect,
    isFetchingIndirect,
    isFetchingJustifications,
  } = pageState
  const directStatements = denormalize(pageState.directStatements, statementsSchema, state.entities)
  const indirectStatements = denormalize(pageState.indirectStatements, statementsSchema, state.entities)
  const justifications = denormalize(pageState.justifications, justificationsSchema, state.entities)
  return {
    isFetchingDirect,
    isFetchingIndirect,
    isFetchingJustifications,
    directStatements,
    indirectStatements,
    justifications,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(PropositionUsagesPage)
