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

import './LoginPage.scss'
import {makeNewCredentials} from "./models";

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
    this.props.api.login(this.props.credentials)
  }

  onCancel() {
    this.props.goBack()
  }

  render () {
    const {
      credentials,
      isLoggingIn,
      isLoginRedirect,
    } = this.props

    // TODO get from editor state
    const errorMessage = ''

    const subtitle = isLoginRedirect && "Please login to continue"

    return (
        <DocumentTitle title={'Login - Howdju'}>
          <div id="loginPage">
            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <Card>
                  <CardTitle title="Login"
                             subtitle={subtitle}
                  />
                  <CardText className={cn({
                      'md-cell': true,
                      'md-cell--12': true,
                      errorMessage: true,
                      hidden: !errorMessage,
                    })}
                  >
                    {errorMessage}
                  </CardText>
                  <form onSubmit={this.onSubmit}>
                    <FocusContainer focusOnMount containFocus={false}>

                      <CardText>
                          <TextField
                              id="email"
                              type="email"
                              name="email"
                              label="Email"
                              value={credentials.email}
                              required
                              onChange={this.onChange}
                              disabled={isLoggingIn}
                          />
                          <TextField
                              id="password"
                              type="password"
                              name="password"
                              label="Password"
                              value={credentials.password}
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

const mapStateToProps = state => ({
  ...state.ui.loginPage,
  credentials: get(state, ['editors', EditorTypes.LOGIN_CREDENTIALS, loginPageEditorId, 'editEntity'], makeNewCredentials()),
  isLoginRedirect: !!state.app.loginRedirectLocation,
})

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
  editors,
}, {
  goBack,
}))(LoginPage)