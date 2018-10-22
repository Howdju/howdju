import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import {Button, Toolbar} from 'react-md'

import {
  api,
  ui,
  goto, mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import './Header.scss'

import ApiAutocomplete from "./ApiAutocomplete"
import {propositionSchema} from "./schemas"
import {ellipsis} from "./characters"

const mainSearchSuggestionsKey = "mainSearch"

class Header extends Component {

  constructor() {
    super()

    this.state = {
      isAutocompleteForcedClosed: true,
    }
  }

  handleToggleNavDrawerVisibility = () => {
    this.props.ui.toggleNavDrawerVisibility()
  }

  onMainSearchChange = (properties) => {
    this.props.ui.mainSearchTextChange(properties['mainSearch'])
  }

  onMainSearch = (event) => {
    event.preventDefault()
    this.setState({isAutocompleteForcedClosed: true})
    this.props.api.cancelMainSearchSuggestions(mainSearchSuggestionsKey)
    this.props.goto.mainSearch(this.props.mainSearchText)
  }

  onMainSearchAutocomplete = (proposition) => {
    this.props.api.cancelMainSearchSuggestions(mainSearchSuggestionsKey)
    this.props.goto.proposition(proposition)
  }

  onMainSearchKeyDown = event => {
    this.setState({isAutocompleteForcedClosed: false})
  }

  render() {
    const {
      mainSearchText,
      api,
      tabs,
    } = this.props
    const {
      isAutocompleteForcedClosed,
    } = this.state

    const dataValue = 'id'
    const dataLabel = 'text'

    const suggestionTransform = proposition => ({
      [dataValue]: `mainSearchSuggestion-${proposition.id}`,
      [dataLabel]: proposition.text,
    })

    const hasTabs = !!tabs

    return (
      <Toolbar
        id="header"
        colored
        fixed
        title={
          <Link to="/">
            <span id="title">
              howdju?
            </span>
          </Link>
        }
        prominent={hasTabs}
        actions={
          <Button icon
                  className="toggleNavDrawerVisibility"
                  onClick={this.handleToggleNavDrawerVisibility}
          >menu</Button>
        }
      >
        <form className="md-cell--12 md-cell--top" onSubmit={this.onMainSearch}>

          <ApiAutocomplete
            id="mainSearch"
            type="search"
            name="mainSearch"
            placeholder={"know that" + ellipsis}
            dataValue={dataValue}
            dataLabel={dataLabel}
            suggestionSchema={propositionSchema}
            value={mainSearchText}
            onAutocomplete={this.onMainSearchAutocomplete}
            suggestionTransform={suggestionTransform}
            onPropertyChange={this.onMainSearchChange}
            onKeyDown={this.onMainSearchKeyDown}
            fetchSuggestions={api.fetchMainSearchSuggestions}
            suggestionsKey={mainSearchSuggestionsKey}
            className="mainSearchAutocomplete"
            inputClassName="md-text-field--toolbar"
            escapeClears={true}
            forcedClosed={isAutocompleteForcedClosed}
          />

        </form>

        {tabs}

      </Toolbar>
    )
  }
}

const mapStateToProps = (state) => {
  const {
    auth: {
      email,
      authToken,
    },
    ui: {
      mainSearch: {
        mainSearchText,
      }
    }
  } = state
  return {
    email,
    authToken,
    mainSearchText,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
  goto,
}))(Header)
