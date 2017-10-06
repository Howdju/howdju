import React, { Component } from 'react'
import { connect } from 'react-redux'
import map from 'lodash/map'
import {denormalize} from "normalizr"
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import FlipMove from 'react-flip-move'

import mainSearcher from './mainSearcher'
import StatementCard from './StatementCard'
import WritCard from './WritCard'
import WritQuoteCard from './WritQuoteCard'
import ListEntitiesWidget from './ListEntitiesWidget'
import {
  app,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {
  writsSchema,
  writQuotesSchema,
  statementsSchema,
} from './schemas'
import config from './config'


class MainSearchPage extends Component {

  componentDidMount() {
    const searchText = mainSearcher.mainSearchText(this.props.location)
    this.fetchResults(searchText)
  }

  componentWillReceiveProps(nextProps) {
    const searchText = mainSearcher.mainSearchText(this.props.location)
    const nextSearchText = mainSearcher.mainSearchText(nextProps.location)
    if (nextSearchText !== searchText) {
      this.fetchResults(nextSearchText)
    }
  }

  fetchResults = (searchText) => {
    this.props.app.searchMainSearch(searchText)
  }

  render () {
    const {
      isFetching,
      statementTexts,
      writQuoteQuoteTexts,
      writQuoteUrls,
      writTitles,
      location,
    } = this.props

    const searchText = mainSearcher.mainSearchText(location)

    const loading = <CircularProgress id="progress" className="md-cell md-cell--12" />
    const noResults = <div className="md-cell md-cell--12">No results.</div>

    return (
      <div id="main-search-page" className="md-grid">
        <h1 className="md-cell md-cell--12">Search results for: &ldquo;{searchText}&rdquo;</h1>
        {isFetching && loading}

        <h2 className="md-cell md-cell--12">
          Statements
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(statementTexts, toStatementCard)}
        </FlipMove>
        {statementTexts.length < 1 && noResults}

        <h2 className="md-cell md-cell--12">
          Writs
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(writTitles, toWritCard)}
        </FlipMove>
        {writTitles.length < 1 && noResults}

        <h2 className="md-cell md-cell--12">
          Writ quotes (text appears within quote)
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(writQuoteQuoteTexts, toWritQuoteCard)}
        </FlipMove>
        {writQuoteQuoteTexts.length < 1 && noResults}

        <h2 className="md-cell md-cell--12">
          Writ quotes (text appears within URL)
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(writQuoteUrls, toWritQuoteWithUrlsCard)}
        </FlipMove>
        {writQuoteUrls.length < 1 && noResults}

      </div>
    )
  }
}

function toStatementCard(statement) {
  const id = `statement-card-${statement.id}`
  return (
    <StatementCard
      statement={statement}
      id={id}
      key={id}
      className={ListEntitiesWidget.smallCellClasses}
    />
  )
}

function toWritQuoteCard(writQuote) {
  const id = `writ-quote-card-${writQuote.id}`
  return (
    <WritQuoteCard
      writQuote={writQuote}
      id={id}
      key={id}
      className={ListEntitiesWidget.smallCellClasses}
    />
  )
}

function toWritQuoteWithUrlsCard(writQuote) {
  const id = `writ-quote-card-${writQuote.id}`
  return (
    <WritQuoteCard
      writQuote={writQuote}
      id={id}
      key={id}
      className={ListEntitiesWidget.smallCellClasses}
      showUrls={true}
    />
  )
}

function toWritCard(writ) {
  const id = `writ-card-${writ.id}`
  return (
    <WritCard
      writ={writ}
      id={id}
      key={id}
      className={ListEntitiesWidget.smallCellClasses}
    />
  )
}

const mapStateToProps = (state) => {
  const {
    ui: {
      mainSearchPage: {
        isFetching,
        results,
      }
    }
  } = state
  const {
    statementTexts,
    writQuoteQuoteTexts,
    writQuoteUrls,
    writTitles,
  } = results

  return {
    isFetching,
    statementTexts: denormalize(statementTexts, statementsSchema, state.entities),
    writQuoteQuoteTexts: denormalize(writQuoteQuoteTexts, writQuotesSchema, state.entities),
    writQuoteUrls: denormalize(writQuoteUrls, writQuotesSchema, state.entities),
    writTitles: denormalize(writTitles, writsSchema, state.entities),
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  app,
}))(MainSearchPage)