import React, { Component } from 'react'
import { connect } from 'react-redux'
import DocumentTitle from 'react-document-title'
import clone from 'lodash/clone'
import TextField from 'react-md/lib/TextFields'
import Button from 'react-md/lib/Buttons/Button'
import Card from 'react-md/lib/Cards'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import CardText from 'react-md/lib/Cards/CardText'
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
      isLoginRedirect,
      errorMessage,
    } = this.props
    return (
        <DocumentTitle title={'Login - Howdju'}>
          <div id="loginPage">
            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <Card>
                  <CardTitle title="Login"
                             subtitle={isLoginRedirect && "Please login to continue"}
                  />
                  <CardText className={classNames({
                      'md-cell': true,
                      'md-cell--12': true,
                      errorMessage: true,
                      hidden: !errorMessage,
                    })}
                  >
                    {errorMessage}
                  </CardText>
                  <CardText>
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
                  </CardText>
                </Card>

              </div>
            </div>

          </div>
        </DocumentTitle>
    )
  }
}

const mapStateToProps = state => {
  return merge(clone(state.ui.loginPage), {isLoginRedirect: !!state.app.loginRedirectLocation})
}

export default connect(mapStateToProps, {
  login,
  loginCredentialChange,
})(LoginPage)