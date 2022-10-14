import React, { Component } from 'react'
import { connect } from 'react-redux'
import {goBack} from 'connected-react-router'
import {Link} from 'react-router-dom'
import Helmet from './Helmet'
import {
  Button,
  Card,
  CardTitle,
  CardText,
  CardActions,
  CircularProgress,
  FocusContainer,
} from 'react-md'
import cn from 'classnames'
import get from 'lodash/get'
import map from 'lodash/map'

import {makeCredentials} from "howdju-common"

import {
  api,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'
import config from './config'
import EmailTextField from './EmailTextField'
import {toErrorText} from "./modelErrorMessages"
import PasswordTextField from './PasswordTextField'
import paths from './paths'
import {EditorTypes} from "./reducers/editors"
import {selectAuthEmail} from './selectors'
import t from './texts'

class LoginPage extends Component {

  componentDidMount() {
    const email = this.props.authEmail || ''
    this.props.editors.beginEdit(EditorTypes.LOGIN_CREDENTIALS, LoginPage.editorId, makeCredentials({email}))
  }

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(EditorTypes.LOGIN_CREDENTIALS, LoginPage.editorId, properties)
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.editors.commitEdit(EditorTypes.LOGIN_CREDENTIALS, LoginPage.editorId)
  }

  onCancel = () => {
    this.props.goBack()
  }

  render () {
    const {
      editorState,
      isLoginRedirect,
    } = this.props

    const subtitle = isLoginRedirect && "Please login to continue"
    const isLoggingIn = get(editorState, 'isSaving')

    const credentials = get(editorState, 'editEntity')
    const email = get(credentials, 'email', '')
    const password = get(credentials, 'password', '')

    const errors = get(editorState, 'errors')
    const credentialsErrors = get(errors, 'credentials')
    const modelErrors = get(credentialsErrors, 'modelErrors')

    const emailInputProps = errors && errors.hasErrors && errors.fieldErrors.email.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.email)} :
      {}
    const passwordInputProps = errors && errors.hasErrors && errors.fieldErrors.password.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.password)} :
      {}

    const modelErrorMessages = modelErrors && modelErrors.length && (
      <CardText className={cn('error-message md-cell md-cell--12')}>
        {/* This somewhat duplicates ErrorMessages; but the error codes for these credentials don't really seem to belong there */}
        <ul className="error-message">
          {map(modelErrors, error => <li key={error}>{t(error)}</li>) ||
          <li>t(AN_UNEXPECTED_ERROR_OCCURRED)</li>
          }
        </ul>
      </CardText>
    )

    return (
      <div id="login-page">
        <Helmet>
          <title>Login — Howdju</title>
        </Helmet>
        <div className="md-grid">
          <div className="md-cell md-cell--12">

            <Card>
              <CardTitle title="Login"
                         subtitle={subtitle}
              />
              {modelErrorMessages}
              <form onSubmit={this.onSubmit}>
                <FocusContainer focusOnMount containFocus={false}>

                  <CardText>
                    <EmailTextField
                      {...emailInputProps}
                      id="email"
                      name="email"
                      value={email}
                      autoComplete="username"
                      required
                      onPropertyChange={this.onPropertyChange}
                      onSubmit={this.onSubmit}
                      disabled={isLoggingIn}
                    />
                    <PasswordTextField
                      {...passwordInputProps}
                      id="password"
                      name="password"
                      autofill="current-password"
                      value={password}
                      autoComplete="current-password"
                      required
                      onPropertyChange={this.onPropertyChange}
                      onSubmit={this.onSubmit}
                      disabled={isLoggingIn}
                    />
                  </CardText>
                  <CardActions>
                    {isLoggingIn && <CircularProgress key="progress" id="progress" />}
                    <Button flat
                            children="Cancel"
                            disabled={isLoggingIn}
                            onClick={this.onCancel}
                    />
                    <Button raised
                            primary
                            type="submit"
                            children="Login"
                            disabled={isLoggingIn}
                    />
                  </CardActions>

                </FocusContainer>
              </form>
              {config.isRegistrationEnabled ? [
                <CardText key="register">
                  <Link className="text-link" to={paths.requestRegistration()}>register</Link>
                </CardText>,
                <CardText key="reset-password">
                  <Link className="text-link" to={paths.requestPasswordReset()}>reset password</Link>
                </CardText>
              ] : null}
            </Card>

          </div>
          <div className="md-cell md-cell--12">

            <Card>
              <form action="//howdju.us16.list-manage.com/subscribe/post?u=ccf334287da1fbf7af0904629&amp;id=f08c3a775d"
                    method="post"
                    target="_blank"
                    rel="noopener"
              >
                <CardText>
                  Howdju 2.0 is currently in private gamma.  Enter your email to be notified when signups are available:
                </CardText>
                <CardText>
                  <EmailTextField id="mce-email"
                                  name="EMAIL"
                                  required
                  />
                  <input type="hidden" name="b_ccf334287da1fbf7af0904629_f08c3a775d" tabIndex="-1" />
                </CardText>
                <CardActions>
                  <Button raised primary type="submit" children="Subscribe" name="subscribe" />
                </CardActions>
              </form>
            </Card>

          </div>
        </div>

      </div>
    )
  }
}
LoginPage.editorId = 'loginPageEditorId'

const mapStateToProps = state => {
  const authEmail = selectAuthEmail(state)
  const editorState = get(state, ['editors', EditorTypes.LOGIN_CREDENTIALS, LoginPage.editorId])
  return ({
    authEmail,
    editorState,
    isLoginRedirect: !!state.app.loginRedirectLocation,
  })
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
  editors,
}, {
  goBack,
}))(LoginPage)
