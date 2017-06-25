import React, { Component } from 'react'
import { connect } from 'react-redux'
import {goBack} from "react-router-redux";
import DocumentTitle from 'react-document-title'
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

import {
  api,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'
import {loginPageEditorId} from './editorIds'
import {EditorTypes} from "./reducers/editors";
import {makeNewCredentials} from "./models";
import {toErrorText} from "./modelErrorMessages";
import {default as t} from './texts'

import './LoginPage.scss'

class LoginPage extends Component {

  constructor() {
    super()

    this.editorId = loginPageEditorId

    this.onChange = this.onChange.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  componentWillMount() {
    this.props.editors.beginEdit(EditorTypes.LOGIN_CREDENTIALS, this.editorId, makeNewCredentials())
  }

  onChange(value, event) {
    const target = event.target;
    const name = target.name
    this.props.editors.propertyChange(EditorTypes.LOGIN_CREDENTIALS, this.editorId, {[name]: value})
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.editors.commitEdit(EditorTypes.LOGIN_CREDENTIALS, this.editorId)
  }

  onCancel() {
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

    return (
        <DocumentTitle title={'Login - Howdju'}>
          <div id="loginPage">
            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <Card>
                  <CardTitle title="Login"
                             subtitle={subtitle}
                  />
                  <CardText className={cn('errorMessage md-cell md-cell--12', {
                      hidden: !modelErrors,
                    })}
                  >
                    {/* This somewhat duplicates ErrorMessages; but the error codes for these credentials don't really seem to belong there */}
                    <ul className="errorMessage">
                      {modelErrors && modelErrors.map(error => <li key={error}>{t(error)}</li>)}
                    </ul>
                  </CardText>
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
                </Card>

              </div>
            </div>

          </div>
        </DocumentTitle>
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