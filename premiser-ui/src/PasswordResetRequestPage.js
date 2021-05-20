import React from 'react'
import {goBack} from 'connected-react-router'
import {Button, Card, CardActions, CardText, CardTitle, CircularProgress, FocusContainer} from 'react-md'
import {connect} from 'react-redux'
import Helmet from 'react-helmet'
import cn from 'classnames'
import get from 'lodash/get'

import {
  keysTo,
  schemaIds,
  schemaSettings,
  toJson,
} from 'howdju-common'
import {validate} from 'howdju-ajv-sourced'

import {api, pages, mapActionCreatorGroupToDispatchToProps} from './actions'
import {selectAuthEmail, selectPasswordResetRequestPage} from './selectors'
import EmailTextField from './EmailTextField'
import moment from 'moment'

class PasswordResetRequestPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      // Which components should show their errors
      blurredInputs: {},
      dirtyInputs: {},
      wasSubmitAttempted: false,
    }
  }

  componentDidMount() {
    this.props.pages.beginPasswordResetRequest()
  }

  render() {
    const {
      authEmail,
      passwordResetRequest,
      isSubmitting,
      isSubmitted,
      errors: apiErrors,
      duration,
    } = this.props
    const {
      blurredInputs,
      dirtyInputs,
      wasSubmitAttempted,
    } = this.state

    const {isValid, errors: validationErrors} = validate(schemaIds.passwordResetRequest, toJson(passwordResetRequest))

    const email = dirtyInputs.email ? passwordResetRequest.email : (authEmail || '')

    const errorMessage = !wasSubmitAttempted || isValid ? null : 'Please correct the errors below'

    const submitButtonTitle = isValid ? 'Request password reset' : wasSubmitAttempted ?
      'Please correct the errors to continue' :
      'Please complete the form to continue'

    const form = (
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
              error={
                (blurredInputs.email || wasSubmitAttempted) &&
                (!!validationErrors.email || get(apiErrors, 'email.value') === email)
              }
              errorText={
                <React.Fragment>
                  {validationErrors.email && 'Please enter a valid email.'}
                  {get(apiErrors, 'email.value') === email && 'That email was not found'}
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
              children="Request"
              disabled={isSubmitting}
              title={submitButtonTitle}
              className={cn({'md-btn--raised-disabled': !isValid, 'md-text--disabled': !isValid})}
              onClick={(event) => this.onClickSubmit(event, isValid)}
            />
          </CardActions>
        </FocusContainer>
      </form>
    )

    const durationText = duration &&
      moment.duration(duration.value).format(duration.formatTemplate, {trim: duration.formatTrim})
    const submissionMessage =
      <React.Fragment>
        <CardText>
          Please check your email to complete your password reset.
          You must complete the password reset within {durationText}.  If your password reset expires, please request
          a password reset again.
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
      <div id="password-reset-page">
        <Helmet>
          <title>Request Password Reset — Howdju</title>
        </Helmet>
        <div className="md-grid">
          <div className="md-cell md-cell--12">
            <Card>
              <CardTitle
                title="Request Password Reset"
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
    const newDirtyInputs = keysTo(properties, true)
    this.setState({
      dirtyInputs: {...this.state.dirtyInputs, ...newDirtyInputs}
    })
    this.props.pages.passwordResetRequestPropertyChange(properties)
  }

  onBlur = (event) => {
    const name = event.target.name
    if (name) {
      this.setState({
        blurredInputs: {...this.state.blurredInputs, [name]: true}
      })
    }
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.api.requestPasswordReset(this.props.passwordResetRequest)
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
      blurredInputs: {},
      wasSubmitAttempted: false,
    })
    this.props.pages.beginPasswordResetRequest()
  }
}

const mapStateToProps = state => {
  const authEmail = selectAuthEmail(state)
  return {
    authEmail,
    ...selectPasswordResetRequestPage(state)
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  pages,
}, {
  goBack
}))(PasswordResetRequestPage)
