import React, { Component } from 'react'
import { connect } from 'react-redux'
import find from 'lodash/find'
import map from 'lodash/map'
import {denormalize} from "normalizr"
import {CircularProgress} from 'react-md'
import FlipMove from 'react-flip-move'

import mainSearcher from './mainSearcher'
import PropositionCard from './PropositionCard'
import WritCard from './WritCard'
import WritQuoteCard from './WritQuoteCard'
import CellList from './CellList'
import {
  app,
  goto,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {
  writsSchema,
  writQuotesSchema,
  propositionsSchema, tagsSchema,
} from './normalizationSchemas'
import config from './config'
import {logger} from './logger'
import TagsViewer from './TagsViewer'


class MainSearchPage extends Component {

  componentDidMount() {
    const searchText = mainSearcher.mainSearchText(this.props.location)
    this.fetchResults(searchText)
  }

  componentDidUpdate(prevProps) {
    const prevSearchText = mainSearcher.mainSearchText(prevProps.location)
    const searchText = mainSearcher.mainSearchText(this.props.location)
    if (prevSearchText !== searchText) {
      this.fetchResults(searchText)
    }
  }

  fetchResults = (searchText) => {
    this.props.app.searchMainSearch(searchText)
  }

  goToTag = (tagName, index, event) => {
    const tag = find(this.props.tags, t => t.name === tagName)
    if (!tag) {
      logger.warn(`Missing tag for ${tagName}`)
      return
    }
    this.props.goto.tag(tag)
  }

  render () {
    const {
      isFetching,
      tags,
      propositionTexts,
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
          Tags
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {tags.length > 0 && (
            <TagsViewer
              tags={tags}
              canHide={false}
              votable={false}
              onClickTag={this.goToTag}
            />
          )}
        </FlipMove>
        {!isFetching && tags.length < 1 && noResults}

        <h2 className="md-cell md-cell--12">
          Propositions
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(propositionTexts, toPropositionCard)}
        </FlipMove>
        {!isFetching && propositionTexts.length < 1 && noResults}

        <h2 className="md-cell md-cell--12">
          Writs
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(writTitles, toWritCard)}
        </FlipMove>
        {!isFetching && writTitles.length < 1 && noResults}

        <h2 className="md-cell md-cell--12">
          Writ quotes (text appears within quote)
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(writQuoteQuoteTexts, toWritQuoteCard)}
        </FlipMove>
        {!isFetching && writQuoteQuoteTexts.length < 1 && noResults}

        <h2 className="md-cell md-cell--12">
          Writ quotes (text appears within URL)
        </h2>
        <FlipMove
          className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
          {...config.ui.flipMove}
        >
          {map(writQuoteUrls, toWritQuoteWithUrlsCard)}
        </FlipMove>
        {!isFetching && writQuoteUrls.length < 1 && noResults}

      </div>
    )
  }
}

function toPropositionCard(proposition) {
  const id = `proposition-card-${proposition.id}`
  return (
    <PropositionCard
      proposition={proposition}
      id={id}
      key={id}
      className={CellList.smallCellClasses}
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
      className={CellList.smallCellClasses}
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
      className={CellList.smallCellClasses}
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
      className={CellList.smallCellClasses}
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
    tags,
    propositionTexts,
    writQuoteQuoteTexts,
    writQuoteUrls,
    writTitles,
  } = results

  return {
    isFetching,
    tags: denormalize(tags, tagsSchema, state.entities),
    propositionTexts: denormalize(propositionTexts, propositionsSchema, state.entities),
    writQuoteQuoteTexts: denormalize(writQuoteQuoteTexts, writQuotesSchema, state.entities),
    writQuoteUrls: denormalize(writQuoteUrls, writQuotesSchema, state.entities),
    writTitles: denormalize(writTitles, writsSchema, state.entities),
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  app,
  goto,
}))(MainSearchPage)