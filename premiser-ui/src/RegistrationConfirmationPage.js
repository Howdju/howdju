import React from 'react'
import { Link } from 'react-router-dom'
import {goBack} from 'react-router-redux'
import {
  Button,
  Card, 
  CardActions, 
  CardText, 
  CardTitle, 
  Checkbox, 
  CircularProgress, 
  FocusContainer, 
} from 'react-md'
import {connect} from 'react-redux'
import Helmet from 'react-helmet'
import cn from 'classnames'
import get from 'lodash/get'
import queryString from 'query-string'

import {
  apiErrorCodes,
  entityErrorCodes,
  keysTo,
  makeNewRegistrationConfirmation, 
  schemaIds, 
  schemaSettings, 
  validate,
} from 'howdju-common'

import {
  api,
  editors,
  mapActionCreatorGroupToDispatchToProps
} from './actions'
import PasswordTextField from './PasswordTextField'
import paths from './paths'
import {EditorTypes} from './reducers/editors'
import {
  selectDidCheckRegistration,
  selectRegistrationErrorCode,
  selectRegistrationEmail,
} from './selectors'
import SingleLineTextField from './SingleLineTextField'

class RegistrationConfirmationPage extends React.Component {

  static editorId = 'registration-confirmation-page'
  static editorType = EditorTypes.REGISTRATION_CONFIRMATION

  constructor(props) {
    super(props)
    this.state = {
      // Which inputs have been modified
      dirtyInputs: {},
      // Which components have been blurred and so can show their errors
      blurredInputs: {},
      // Whether the user has clicked on the submit button
      wasSubmitAttempted: false,
    }
  }

  componentDidMount() {
    this.props.api.checkRegistration(this.props.registrationCode)
    this.props.editors.beginEdit(RegistrationConfirmationPage.editorType, RegistrationConfirmationPage.editorId, 
      makeNewRegistrationConfirmation({registrationCode: this.props.registrationCode}))
  }

  componentDidUpdate(prevProps) {
    if (prevProps.registrationCode !== this.props.registrationCode) {
      // put the code on the editEntity so that it is passed with the editor commit
      const properties = {registrationCode: this.props.registrationCode}
      this.editors.propertyChange(RegistrationConfirmationPage.editorType, RegistrationConfirmationPage.editorId, properties)
    }
  }
  
  render() {
    const {
      email,
      didCheckRegistration,
      registrationErrorCode,
      editorState,
    } = this.props
    const {
      blurredInputs,
      dirtyInputs,
      wasSubmitAttempted,
    } = this.state

    const isSubmitting = get(editorState, 'isSaving')
    const isConfirmed = get(editorState, 'isConfirmed')
    const apiErrors = get(editorState, 'errors') || {}

    const registrationConfirmation = get(editorState, 'editEntity')
    const username = get(registrationConfirmation, 'username', '')
    const shortName = get(registrationConfirmation, 'shortName', '')
    const longName = get(registrationConfirmation, 'longName', '')
    const password = get(registrationConfirmation, 'password', '')
    const doesAcceptTerms = get(registrationConfirmation, 'doesAcceptTerms', false)

    const {isValid, errors: validationErrors} = registrationConfirmation ?
      validate(schemaIds.registrationConfirmation, registrationConfirmation) :
      {isValid: false, errors: {}}

    const errorNotificeMessage = !wasSubmitAttempted || isValid ? null : 'Please correct the errors below'

    const submitButtonTitle = isValid ? 'Complete registration' : wasSubmitAttempted ?
      'Please correct the errors to continue' :
      'Please complete the form to continue'
    
    const subtitle = subtitleByRegistrationErrorCode[registrationErrorCode]

    const form =
      <form onSubmit={this.onSubmit}>
        <FocusContainer focusOnMount containFocus={false}>
          <CardText>
            <SingleLineTextField
              id="email"
              value={email}
              label="Email"
              disabled
            />
            <SingleLineTextField
              id="username"
              name="username"
              label="Username"
              value={username}
              maxLength={schemaSettings.usernameMaxLength}
              onPropertyChange={this.onPropertyChange}
              onBlur={this.onBlur}
              onSubmit={this.onSubmit}
              disabled={isSubmitting}
              required
              error={(blurredInputs.username || wasSubmitAttempted) && (!!validationErrors.username || !!apiErrors.username)}
              errorText={
                <React.Fragment>
                  {validationErrors.username &&
                  'Please enter a valid username (letters, numbers, and underscores).'}
                  {get(apiErrors, 'username.code') === entityErrorCodes.USERNAME_TAKEN &&
                  apiErrors.username.value === username &&
                  'That username is already registered.'
                  }
                </React.Fragment>
              }
            />
            <PasswordTextField
              id="password"
              name="password"
              value={password}
              minLength={schemaSettings.passwordMinLength}
              maxLength={schemaSettings.passwordMaxLength}
              onPropertyChange={this.onPropertyChange}
              onBlur={this.onBlur}
              onSubmit={this.onSubmit}
              disabled={isSubmitting}
              required
              error={(blurredInputs.password || wasSubmitAttempted) && !!validationErrors.password}
              errorText={validationErrors.password && 'Please enter a valid password (6 characters or more)'}
            />
            <SingleLineTextField
              id="long-name"
              name="longName"
              label="Full Name"
              value={longName}
              maxLength={schemaSettings.longNameMaxLength}
              onPropertyChange={this.onPropertyChange}
              onBlur={this.onBlur}
              onSubmit={this.onSubmit}
              disabled={isSubmitting}
              required
              error={(blurredInputs.longName || wasSubmitAttempted) && !!validationErrors.longName}
              errorText={validationErrors.longName && 'Please enter a full name name'}
            />
            <SingleLineTextField
              id="short-name"
              name="shortName"
              label="First Name"
              value={shortName}
              maxLength={schemaSettings.shortNameMaxLength}
              onPropertyChange={this.onPropertyChange}
              onBlur={this.onBlur}
              onSubmit={this.onSubmit}
              disabled={isSubmitting}
              error={(blurredInputs.shortName || wasSubmitAttempted) && !!validationErrors.shortName}
              errorText={validationErrors.shortName && 'Please enter a first name'}
            />
            <Checkbox
              id="accept-terms"
              name="doesAcceptTerms"
              value={doesAcceptTerms}
              onChange={this.onChange}
              label={
                <div
                  className={cn({
                    'error-message': (dirtyInputs.doesAcceptTerms || wasSubmitAttempted) && validationErrors.doesAcceptTerms})
                  }
                >
                  I have read and agree to the <Link className="text-link" to={paths.terms()}>Terms of Use</Link>
                </div>
              }
            />
          </CardText>
          <CardActions>
            {isSubmitting && <CircularProgress key="progress" id="progress" />}
            <Button
              flat
              children="Cancel"
              disabled={isSubmitting}
              onClick={this.onCancel}
            />
            <Button
              raised={isValid}
              flat={!isValid}
              primary={isValid}
              type="submit"
              children="Register"
              disabled={isSubmitting}
              title={submitButtonTitle}
              className={cn({'md-btn--raised-disabled': !isValid, 'md-text--disabled': !isValid})}
              onClick={(event) => this.onClickSubmit(event, isValid)}
            />
          </CardActions>
        </FocusContainer>
      </form>

    const confirmedMessage =
      <React.Fragment>
        <CardText>
          You are now logged in.
        </CardText>
        <CardActions>
          <Button
            raised
            primary
            children="Go to recent activity"
            href={paths.recentActivity()}
          />
        </CardActions>
      </React.Fragment>
    
    const errorMessage = registrationErrorMessageByCode[registrationErrorCode]

    const formWithNotice = (
      <React.Fragment>
        <CardText>
          Please enter the following to complete your registration
        </CardText>
        {errorNotificeMessage &&
          <CardText className="error-message">
            {errorNotificeMessage}
          </CardText>
        }
        {form}
      </React.Fragment>
    )
    
    return (
      <div id="register-page">
        <Helmet>
          <title>Register — Howdju</title>
        </Helmet>
        <div className="md-grid">
          <div className="md-cell md-cell--12">
            <Card>
              <CardTitle
                title="Complete Registration"
                subtitle={subtitle}
              />
              {!didCheckRegistration && (
                <CardText>
                  Checking confirmation code…
                  <CircularProgress id="checking-registration-code-progress"/>
                </CardText>
              )}
              {didCheckRegistration && !isConfirmed && registrationErrorCode && errorMessage}
              {didCheckRegistration && !isConfirmed && !registrationErrorCode && formWithNotice}
              {isConfirmed && confirmedMessage}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  onPropertyChange = (properties) => {
    const newDirtyInputs = keysTo(properties, true)
    this.setState({
      dirtyInputs: {...this.state.dirtyInputs, ...newDirtyInputs}
    })
    this.props.editors.propertyChange(RegistrationConfirmationPage.editorType, RegistrationConfirmationPage.editorId, properties)
  }

  onBlur = (event) => {
    const name = event.target.name
    if (name) {
      this.setState({
        blurredInputs: {...this.state.blurredInputs, [name]: true}
      })
    }
  }

  onChange = (val, event) => {
    const name = event.target.name
    this.setState({
      dirtyInputs: {...this.state.dirtyInputs, [name]: true}
    })
    this.onPropertyChange({[name]: val})
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.editors.commitEdit(RegistrationConfirmationPage.editorType, RegistrationConfirmationPage.editorId)
  }

  onClickSubmit = (event, isValid) => {
    if (!isValid) {
      event.preventDefault()
    }
    this.setState({
      wasSubmitAttempted: true
    })
  }

  onCancel = () => {
    this.props.goBack()
  }
}

const subtitleByRegistrationErrorCode = {
  [apiErrorCodes.ENTITY_NOT_FOUND]: 'Registration not found',
  [apiErrorCodes.EXPIRED]: 'Registration expired',
  [apiErrorCodes.CONSUMED]: 'Registration already used',
}

const registrationErrorMessageByCode = {
  [apiErrorCodes.ENTITY_NOT_FOUND]: (
    <CardText>
      That registration could not be found.  Please double check the link in the confirmation email.
      If this problem persists, please <Link className="text-link" to={paths.requestRegistration()}>register</Link> again.
    </CardText>
  ),
  [apiErrorCodes.EXPIRED]: (
    <CardText>
      This registration has expired.  Please <Link className="text-link" to={paths.requestRegistration()}>register</Link> again.
    </CardText>
  ),
  [apiErrorCodes.CONSUMED]: (
    <CardText>
      That registration has already been used. Please <Link className="text-link" to={paths.login()}>login</Link>.
      If you have forgotten your password, you
      can <Link className="text-link" to={paths.requestPasswordReset()}>reset your password</Link>.  If you
      don&rsquo;t have access to your password reset email, you
      can <Link className="text-link" to={paths.requestRegistration()}>register</Link> again.
    </CardText>
  )
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state, ['editors', RegistrationConfirmationPage.editorType, RegistrationConfirmationPage.editorId])
  
  const email = selectRegistrationEmail(state)
  const didCheckRegistration = selectDidCheckRegistration(state)
  const registrationErrorCode = selectRegistrationErrorCode(state)
  
  const queryParams = queryString.parse(ownProps.location.search)
  const registrationCode = queryParams.registrationCode
  return {
    editorState,
    email,
    didCheckRegistration,
    registrationErrorCode,
    registrationCode,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
}, {
  goBack,
}))(RegistrationConfirmationPage)