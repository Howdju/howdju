import React from 'react'
import { Link } from 'react-router-dom'
import {connect} from 'react-redux'
import {goBack} from "connected-react-router"
import Helmet from 'react-helmet'
import {
  Button,
  Card,
  CardActions,
  CardText,
  CardTitle,
  CircularProgress,
  FocusContainer
} from 'react-md'
import get from 'lodash/get'
import moment from 'moment'
import cn from 'classnames'

import {
  entityErrorCodes,
  makeNewRegistrationRequest,
  schemaSettings,
  schemaIds,
  toJson,
} from 'howdju-common'
import {validate} from 'howdju-ajv-sourced'

import {editors, mapActionCreatorGroupToDispatchToProps} from './actions'
import EmailTextField from './EmailTextField'
import paths from './paths'
import {EditorTypes} from './reducers/editors'

class RegistrationRequestPage extends React.Component {

  static editorId = 'registration-request-page'
  static editorType = EditorTypes.REGISTRATION_REQUEST

  constructor(props) {
    super(props)
    this.state = {
      // Which components should show their errors
      dirty: {},
      wasSubmitAttempted: false,
    }
  }

  componentDidMount() {
    this.props.editors.beginEdit(RegistrationRequestPage.editorType, RegistrationRequestPage.editorId, makeNewRegistrationRequest())
  }

  render() {
    const {
      editorState,
    } = this.props
    const {
      dirty,
      wasSubmitAttempted,
    } = this.state

    const isSubmitting = get(editorState, 'isSaving')
    const isSubmitted = get(editorState, 'isSubmitted')
    const apiErrors = get(editorState, 'errors') || {}
    const duration = get(editorState, 'duration')

    const registration = get(editorState, 'editEntity')
    const email = get(registration, 'email', '')

    const {isValid, errors: validationErrors} = registration ?
      validate(schemaIds.registrationRequest, toJson(registration)) :
      {isValid: false, errors: {}}

    const errorMessage = !wasSubmitAttempted || isValid ? null : 'Please correct the errors below'

    const submitButtonTitle = isValid ? 'Register' : wasSubmitAttempted ?
      'Please correct the errors to continue' :
      'Please complete the form to continue'

    const form =
      <form onSubmit={this.onSubmit}>
        <FocusContainer focusOnMount containFocus={false}>
          <CardText>
            <EmailTextField
              id="email"
              name="email"
              value={email}
              maxLength={schemaSettings.userEmailMaxLength}
              onBlur={this.onBlur}
              onSubmit={this.onSubmit}
              onPropertyChange={this.onPropertyChange}
              disabled={isSubmitting}
              required
              error={(dirty.email || wasSubmitAttempted) && (!!validationErrors.email || apiErrors.email)}
              errorText={
                <React.Fragment>
                  {validationErrors.email && 'Please enter a valid email.'}
                  {get(apiErrors, 'email.code') === entityErrorCodes.EMAIL_TAKEN &&
                    apiErrors.email.value === email &&
                    <span>
                      That email is already registered.
                      Please <Link className="text-link" to={paths.login()}>login</Link> to continue with this email.
                    </span>
                  }
                </React.Fragment>
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

    const durationText = duration &&
      moment.duration(duration.value).format(duration.formatTemplate, {trim: duration.formatTrim})
    const submissionMessage =
      <React.Fragment>
        <CardText>
          Your registration has been submitted.  Please check your email to complete your registration.
          You must complete your registration within {durationText}.  If your registration expires, please register again.
        </CardText>
        <CardActions>
          <Button
            raised
            primary
            children="Return"
            onClick={this.resetSubmission}
          />
        </CardActions>
      </React.Fragment>

    return (
      <div id="register-page">
        <Helmet>
          <title>Register — Howdju</title>
        </Helmet>
        <div className="md-grid">
          <div className="md-cell md-cell--12">
            <Card>
              <CardTitle
                title="Register"
              />
              {errorMessage &&
                <CardText className="error-message">
                  {errorMessage}
                </CardText>
              }
              {isSubmitted ? submissionMessage : form}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(RegistrationRequestPage.editorType, RegistrationRequestPage.editorId, properties)
  }

  onBlur = (event) => {
    const name = event.target.name
    if (name) {
      this.setState({
        dirty: {...this.state.dirty, [name]: true}
      })
    }
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.editors.commitEdit(RegistrationRequestPage.editorType, RegistrationRequestPage.editorId)
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

  resetSubmission = () => {
    this.setState({
      dirty: {},
      wasSubmitAttempted: false,
    })
    this.props.editors.beginEdit(RegistrationRequestPage.editorType, RegistrationRequestPage.editorId, makeNewRegistrationRequest())
    this.props.editors.resetSubmission(RegistrationRequestPage.editorType, RegistrationRequestPage.editorId)
  }
}

const mapStateToProps = state => {
  const editorState = get(state, ['editors', RegistrationRequestPage.editorType, RegistrationRequestPage.editorId])
  return {
    editorState
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}, {
  goBack,
}))(RegistrationRequestPage)
