import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import clone from 'lodash/clone'

import {login, loginCredentialChange} from './actions'

class LoginPage extends Component {

  constructor() {
    super()
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name
    this.props.loginCredentialChange({[name]: value})
  }

  handleSubmit(event) {
    event.preventDefault()
    this.props.login({credentials: this.props.credentials})
  }

  render () {
    return (
        <div id="login-page">
          <div className="error-message">{this.props.errorMessage}</div>
          <form onSubmit={this.handleSubmit}>
            <label>
              Email
              <input type="text" name="email" value={this.props.credentials.email} onChange={this.handleInputChange}/>
            </label>
            <label>
              Password
              <input type="password" name="password" value={this.props.credentials.password} onChange={this.handleInputChange}/>
            </label>
            <input disabled={this.props.isLoggingIn} type="submit" value="Login"/>
          </form>
        </div>
    )
  }
}

const mapStateToProps = state => clone(state.ui.loginPage)

export default connect(mapStateToProps, {
  login,
  loginCredentialChange,
})(LoginPage)