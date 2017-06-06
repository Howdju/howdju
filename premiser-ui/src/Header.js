import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Button from 'react-md/lib/Buttons/Button'
import Autocomplete from 'react-md/lib/Autocompletes';
import Toolbar from 'react-md/lib/Toolbars';
import throttle from 'lodash/throttle'

import {
  api,
  ui,
  goto, mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import autocompleter from './autocompleter'
import './Header.scss'

import {
  ESCAPE_KEY_CODE
} from './keyCodes'

class Header extends Component {

  constructor() {
    super()
    this.handleToggleNavDrawerVisibility = this.handleToggleNavDrawerVisibility.bind(this)
    this.onMainSearchChange = this.onMainSearchChange.bind(this)
    this.refreshAutocomplete = throttle(this.refreshAutocomplete.bind(this), 250)
    this.onMainSearch = this.onMainSearch.bind(this)
    this.onMainSearchAutocomplete = this.onMainSearchAutocomplete.bind(this)
    this.onMainSearchKeyDown = this.onMainSearchKeyDown.bind(this)
  }

  handleToggleNavDrawerVisibility() {
    this.props.ui.toggleNavDrawerVisibility()
  }

  onMainSearchChange(text) {
    this.props.ui.mainSearchTextChange(text)
    if (text === '') {
      this.refreshAutocomplete.cancel()
      this.props.ui.clearMainSearchAutocomplete()
    } else {
      this.refreshAutocomplete(text)
    }
  }

  onMainSearchKeyDown(e) {
    if (e.keyCode === ESCAPE_KEY_CODE) {
      this.refreshAutocomplete.cancel()
      this.props.ui.clearMainSearchAutocomplete()
      // TODO shouldn't this be close on first escape, clear on second?
      this.mainSearchAutocomplete._close()
    }
  }

  componentWillReceiveProps(nextProps) {
    autocompleter.fixOpen(this.mainSearchAutocomplete, nextProps.mainSearchText, nextProps.autocompleteResults)
  }

  onMainSearch(e) {
    e.preventDefault()
    this.mainSearchAutocomplete._close()
    this.props.goto.mainSearch(this.props.mainSearchText)
  }

  refreshAutocomplete(text) {
    this.props.api.fetchMainSearchAutocomplete(text)
  }

  onMainSearchAutocomplete(name, label, index) {
    const autocompleteResult = this.props.autocompleteResults[index]
    this.props.goto.statement(autocompleteResult)
  }

  render() {
    const {
      mainSearchText,
      autocompleteResults,
    } = this.props

    const autocompleteData = autocompleteResults.map(s => ({
      id: s.id,
      key: `autocomplete-${s.id}`,
      label: s.text,
    }))

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

          <Autocomplete
              id="mainSearch"
              type="search"
              name="mainSearch"
              block
              clearOnAutocomplete
              placeholder="know that..."
              data={autocompleteData}
              filter={null}
              dataLabel="label"
              dataValue="id"
              value={mainSearchText}
              onChange={this.onMainSearchChange}
              onAutocomplete={this.onMainSearchAutocomplete}
              onKeyDown={this.onMainSearchKeyDown}
              className="mainSearchAutocomplete"
              inputClassName="md-text-field--toolbar"
              ref={el => this.mainSearchAutocomplete = el}
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
        autocompleteResults,
      }
    }
  } = state
  return {
    email,
    authToken,
    mainSearchText,
    autocompleteResults,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
  goto,
}))(Header)
