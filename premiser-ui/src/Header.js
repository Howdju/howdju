import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Button from 'react-md/lib/Buttons/Button'
import Toolbar from 'react-md/lib/Toolbars';
import get from 'lodash/get'

import {
  api,
  ui,
  goto, mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import './Header.scss'

import ApiAutocomplete from "./ApiAutocomplete";
import {denormalize} from "normalizr";
import {statementSchema} from "./schemas";

const mainSearchSuggestionsKey = "mainSearch"

class Header extends Component {

  constructor() {
    super()

    this.handleToggleNavDrawerVisibility = this.handleToggleNavDrawerVisibility.bind(this)
    this.onMainSearchChange = this.onMainSearchChange.bind(this)
    this.onMainSearch = this.onMainSearch.bind(this)
    this.onMainSearchAutocomplete = this.onMainSearchAutocomplete.bind(this)
  }

  handleToggleNavDrawerVisibility() {
    this.props.ui.toggleNavDrawerVisibility()
  }

  onMainSearchChange(properties) {
    this.props.ui.mainSearchTextChange(properties['mainSearch'])
  }

  onMainSearch(e) {
    e.preventDefault()
    this.props.goto.mainSearch(this.props.mainSearchText)
  }

  onMainSearchAutocomplete(statement) {
    this.props.goto.statement(statement)
  }

  render() {
    const {
      mainSearchText,
      api,
    } = this.props

    const dataValue = 'id'
    const dataLabel = 'text'

    const suggestionTransform = statement => ({
      [dataValue]: `mainSearchSuggestion-${statement.id}`,
      [dataLabel]: statement.text,
    })

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
          actions={<Button icon className="toggleNavDrawerVisibility" onClick={this.handleToggleNavDrawerVisibility}>menu</Button>}
      >
        <form className="md-cell--12 md-cell--middle" onSubmit={this.onMainSearch}>

          <ApiAutocomplete
              id="mainSearch"
              type="search"
              name="mainSearch"
              block
              placeholder="know that..."
              dataValue={dataValue}
              dataLabel={dataLabel}
              value={mainSearchText}
              onAutocomplete={this.onMainSearchAutocomplete}
              suggestionTransform={suggestionTransform}
              onPropertyChange={this.onMainSearchChange}
              fetchSuggestions={api.fetchMainSearchSuggestions}
              suggestionsKey={mainSearchSuggestionsKey}
              className="mainSearchAutocomplete"
              inputClassName="md-text-field--toolbar"
              escapeClears={true}
            />

        </form>

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
