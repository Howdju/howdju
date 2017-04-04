import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import {logout} from "./actions";

class Header extends Component {

  constructor() {
    super()
    this.handleLogout = this.handleLogout.bind(this)
  }

  handleLogout() {
    this.props.logout()
  }

  render() {
    return (
        <div id="header">
          <Link to="/">Howdju?</Link>
          <input type="text" />
          {this.props.authenticationToken ?
              <div>
                <span>You are logged in as {this.props.email}</span>
                <button onClick={this.handleLogout}>Logout</button>
              </div> :
              <Link to="/login">Login</Link>
          }
        </div>
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
  logout
})(Header)