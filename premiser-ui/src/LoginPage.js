import React, { Component } from 'react'
import { connect } from 'react-redux'
import {goBack} from "react-router-redux";
import Helmet from 'react-helmet'
import TextField from 'react-md/lib/TextFields'
import Button from 'react-md/lib/Buttons/Button'
import Card from 'react-md/lib/Cards'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import CardText from 'react-md/lib/Cards/CardText'
import CardActions from 'react-md/lib/Cards/CardActions';
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import FocusContainer from 'react-md/lib/Helpers/FocusContainer'
import cn from 'classnames'
import get from 'lodash/get'
import map from 'lodash/map'

import {
  api,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'
import {loginPageEditorId} from './editorIds'
import {EditorTypes} from "./reducers/editors";
import {makeNewCredentials} from "howdju-common";
import {toErrorText} from "./modelErrorMessages";
import {
  default as t,
} from './texts'
import analytics from "./analytics";

import './LoginPage.scss'


class LoginPage extends Component {

  constructor() {
    super()

    this.editorId = loginPageEditorId
  }

  componentWillMount() {
    this.props.editors.beginEdit(EditorTypes.LOGIN_CREDENTIALS, this.editorId, makeNewCredentials())
  }

  onChange = (value, event) => {
    const target = event.target;
    const name = target.name
    this.props.editors.propertyChange(EditorTypes.LOGIN_CREDENTIALS, this.editorId, {[name]: value})
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.editors.commitEdit(EditorTypes.LOGIN_CREDENTIALS, this.editorId)
  }

  onCancel = () => {
    this.props.goBack()
  }

  onSubscribeSubmit = event => {
    analytics.sendEvent('Mailing List Signup Form', 'submit')
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
                      <TextField
                          {...emailInputProps}
                          id="email"
                          type="email"
                          name="email"
                          label="Email"
                          value={email}
                          required
                          onChange={this.onChange}
                          disabled={isLoggingIn}
                      />
                      <TextField
                          {...passwordInputProps}
                          id="password"
                          type="password"
                          name="password"
                          label="Password"
                          value={password}
                          required
                          onChange={this.onChange}
                          disabled={isLoggingIn}
                      />
                  </CardText>
                  <CardActions>
                    {isLoggingIn && <CircularProgress key="progress" id="progress" />}
                    <Button flat
                            label="Cancel"
                            disabled={isLoggingIn}
                            onClick={this.onCancel}
                    />
                    <Button raised
                            primary
                            type="submit"
                            label="Login"
                            disabled={isLoggingIn}
                    />
                  </CardActions>

                </FocusContainer>
              </form>
            </Card>

          </div>
          <div className="md-cell md-cell--12">

            <Card>
              <form action="//howdju.us16.list-manage.com/subscribe/post?u=ccf334287da1fbf7af0904629&amp;id=f08c3a775d"
                    method="post"
                    target="_blank"
                    rel="noopener"
                    onSubmit={this.onSubscribeSubmit}
              >
                <CardText>
                  Howdju 2.0 is currently in private gamma.  Enter your email to be notified when signups are available:
                </CardText>
                <CardText>
                  <TextField id="mce-email"
                             type="email"
                             name="EMAIL"
                             label="Email"
                             required
                  />
                  <input type="hidden" name="b_ccf334287da1fbf7af0904629_f08c3a775d" tabIndex="-1" />
                </CardText>
                <CardActions>
                  <Button raised primary type="submit" label="Subscribe" name="subscribe" />
                </CardActions>
              </form>
            </Card>

          </div>
        </div>

      </div>
    )
  }
}

const mapStateToProps = state => {
  const editorState = get(state, ['editors', EditorTypes.LOGIN_CREDENTIALS, loginPageEditorId])
  return ({
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