import React from "react"
import FlipMove from 'react-flip-move'
import {connect} from "react-redux"
import {CircularProgress} from 'react-md'
import get from 'lodash/get'
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
import config from './config'
import {statementsSchema} from './normalizationSchemas'
import StatementCard from "./StatementCard"
import {combineIds} from './viewModels'


class PropositionUsagesPage extends React.Component {

  static id = 'proposition-usages-page'
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
    // later: fetchPropositionAppearances
  }

  render() {
    const {
      isFetchingDirect,
      isFetchingIndirect,
      directStatements,
      indirectStatements,
    } = this.props
    const flipMoveProps = config.ui.flipMove

    const hasDirectStatements = directStatements && directStatements.length > 0
    const hasIndirectStatements = indirectStatements && indirectStatements.length > 0

    return (
      <div className="md-grid">
        <h1 className="md-cell md-cell--12">Direct Statements</h1>
        <FlipMove
          {...flipMoveProps}
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
        </FlipMove>
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
        <FlipMove
          {...flipMoveProps}
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
        </FlipMove>
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

      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const pageState = get(state, ['ui', 'propositionUsagesPage'], {})
  const {
    isFetchingDirect,
    isFetchingIndirect,
  } = pageState
  const directStatements = denormalize(pageState.directStatements, statementsSchema, state.entities)
  const indirectStatements = denormalize(pageState.indirectStatements, statementsSchema, state.entities)
  return {
    isFetchingDirect,
    isFetchingIndirect,
    directStatements,
    indirectStatements,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(PropositionUsagesPage)
