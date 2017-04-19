import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import DocumentTitle from 'react-document-title'
import clone from 'lodash/clone'
import TextField from 'react-md/lib/TextFields'
import Button from 'react-md/lib/Buttons/Button'
import Paper from 'react-md/lib/Papers/Paper';
import merge from 'lodash/merge'
import classNames from 'classnames'


import {login, loginCredentialChange} from './actions'
import './LoginPage.scss'

class LoginPage extends Component {

  constructor() {
    super()
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleInputChange(value, event) {
    const target = event.target;
    const name = target.name
    this.props.loginCredentialChange({[name]: value})
  }

  handleSubmit(event) {
    event.preventDefault()
    this.props.login({credentials: this.props.credentials})
  }

  render () {
    const {
      credentials,
      isLoggingIn,
      loginRedirectLocation,
      errorMessage,
    } = this.props
    return (
        <DocumentTitle title={'Login - Howdju'}>
          <div id="loginPage">
            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <Paper zDepth={2}>
                  <div className="md-grid">
                    <div className={classNames({
                      'md-cell': true,
                       'md-cell--12': true,
                       hidden: !loginRedirectLocation,
                    })}>
                      <h4>Please login to continue</h4>
                    </div>
                    <div className={classNames({
                      'md-cell': true,
                      'md-cell--12': true,
                      errorMessage: true,
                      hidden: !errorMessage,
                    })}>
                      {errorMessage}
                    </div>
                    <div className="md-cell md-cell--12">

                      <form onSubmit={this.handleSubmit}>
                          <TextField
                              id="loginEmail"
                              type="email"
                              name="email"
                              label="Email"
                              value={credentials.email}
                              required
                              onChange={this.handleInputChange}
                          />
                          <TextField
                              id="loginPassword"
                              type="password"
                              name="password"
                              label="Password"
                              value={credentials.password}
                              required
                              onChange={this.handleInputChange}
                          />

                        <Button raised primary type="submit" label="Login" disabled={isLoggingIn} />
                      </form>

                    </div>
                  </div>
                </Paper>

              </div>
            </div>

          </div>
        </DocumentTitle>
    )
  }
}

const mapStateToProps = state => {
  return merge(clone(state.ui.loginPage), {loginRedirectLocation: state.app.loginRedirectLocation})
}

export default connect(mapStateToProps, {
  login,
  loginCredentialChange,
})(LoginPage)