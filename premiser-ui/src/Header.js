import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import Button from 'react-md/lib/Buttons/Button'
import Autocomplete from 'react-md/lib/Autocompletes';
import Toolbar from 'react-md/lib/Toolbars';

import {toggleNavDrawerVisibility} from "./actions"
import './Header.scss'

class Header extends Component {

  constructor() {
    super()
    this.handleToggleNavDrawerVisibility = this.handleToggleNavDrawerVisibility.bind(this)
    this.state = {autoComplete: { data: [] }}
  }

  handleToggleNavDrawerVisibility() {
    this.props.toggleNavDrawerVisibility()
  }

  render() {
    return (
      <Toolbar
          id="header"
          colored
          fixed
          title={
            <Link to="/" id="title">
              <span id="title">
                howdju?
              </span>
            </Link>
          }
          actions={<Button icon onClick={this.handleToggleNavDrawerVisibility}>menu</Button>}
      >
        <div className="md-cell--12 md-cell--middle">

          <Autocomplete
              id="mainSearch"
              placeholder=" know..."
              data={this.state.autoComplete.data}
              filter={null}
              // dataLabel="name"
              // value={this.state.value}
              // onChange={this._handleChange}
              // onAutocomplete={this._handleChange}
              block
              // className="md-title--toolbar"
              inputClassName="md-text-field--toolbar"
          />

        </div>

      </Toolbar>
    )
  }
}

const mapStateToProps = (state) => {
  const {
    auth: {
      email,
      authenticationToken,
    }
  } = state
  return {
    email,
    authenticationToken,
  }
}

export default connect(mapStateToProps, {
  toggleNavDrawerVisibility
})(Header)