import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Button from 'react-md/lib/Buttons/Button'
import Autocomplete from 'react-md/lib/Autocompletes';
import Toolbar from 'react-md/lib/Toolbars';
import throttle from 'lodash/throttle'

import {
  toggleNavDrawerVisibility, mainSearchTextChange, doMainSearch, initializeMainSearch
} from "./actions"
import './Header.scss'

class Header extends Component {

  constructor() {
    super()
    this.handleToggleNavDrawerVisibility = this.handleToggleNavDrawerVisibility.bind(this)
    this.onMainSearchChange = this.onMainSearchChange.bind(this)
    this.refreshAutocomplete = throttle(this.refreshAutocomplete.bind(this), 250)
    this.onMainSearch = this.onMainSearch.bind(this)
    this.state = {autoComplete: { data: [] }}
    this.hasInitializedMainSearch = false
  }

  handleToggleNavDrawerVisibility() {
    this.props.toggleNavDrawerVisibility()
  }

  onMainSearchChange(text) {
    this.props.mainSearchTextChange(text)
    this.refreshAutocomplete()
  }

  onMainSearch(e) {
    e.preventDefault()
    this.props.doMainSearch(this.props.mainSearchText)
  }

  refreshAutocomplete() {
    // TODO
  }

  onAutocomplete(statement, index) {
    this.props.viewStatement(statement)
  }

  render() {
    const {
      mainSearchText
    } = this.props
    const mainSearchAutocompleteData = []
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
              placeholder="know that..."
              data={mainSearchAutocompleteData}
              filter={null}
              type="search"
              // dataLabel="name"
              // dataValue="id"
              value={mainSearchText}
              onChange={this.onMainSearchChange}
              onAutocomplete={this.onAutocomplete}
              block
              // className="md-title--toolbar"
              inputClassName="md-text-field--toolbar"
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
      app: {
        mainSearchText
      }
    }
  } = state
  return {
    email,
    authToken,
    mainSearchText,
  }
}

export default connect(mapStateToProps, {
  toggleNavDrawerVisibility,
  mainSearchTextChange,
  doMainSearch,
})(Header)
