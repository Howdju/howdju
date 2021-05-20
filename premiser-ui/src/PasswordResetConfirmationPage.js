import React from 'react'
import {goBack} from 'connected-react-router'
import { Link } from 'react-router-dom'
import {
  Button,
  Card,
  CardActions,
  CardText,
  CardTitle,
  CircularProgress,
  FocusContainer,
} from 'react-md'
import {connect} from 'react-redux'
import Helmet from 'react-helmet'
import cn from 'classnames'
import queryString from 'query-string'

import {
  apiErrorCodes,
  schemaIds,
  schemaSettings,
  toJson,
} from 'howdju-common'
import {validate} from 'howdju-ajv-sourced'

import {
  api,
  pages,
  mapActionCreatorGroupToDispatchToProps
} from './actions'
import PasswordTextField from './PasswordTextField'
import paths from './paths'
import {
  selectPasswordResetConfirmationPage
} from './selectors'

const subtitleByErrorCode = {
  [apiErrorCodes.ENTITY_NOT_FOUND]: 'Password reset request not found',
  [apiErrorCodes.EXPIRED]: 'Password reset request expired',
  [apiErrorCodes.CONSUMED]: 'Password reset request already used',
}

class PasswordResetConfirmationPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      // Which components should show their errors
      dirty: {},
      // Whether the user has clicked on the submit button
      wasSubmitAttempted: false,
    }
  }

  componentDidMount() {
    this.props.pages.beginPasswordResetConfirmation()
    this.props.api.checkPasswordResetRequest(this.props.passwordResetCode)
  }

  render() {
    const {
      email,
      didCheck,
      errorCode,
      passwordResetConfirmation,
      isSubmitting,
      isSubmitted,
    } = this.props
    const {
      dirty,
      wasSubmitAttempted,
    } = this.state

    const {isValid, errors: validationErrors} =
      validate(schemaIds.passwordResetConfirmation, toJson(passwordResetConfirmation))

    const errorNoticeMessage = !wasSubmitAttempted || isValid ? null : 'Please correct the errors below'

    const submitButtonTitle = isValid ? 'Reset password' : wasSubmitAttempted ?
      'Please correct the errors to continue' :
      'Please complete the form to continue'

    const subtitle = subtitleByErrorCode[errorCode]

    const form =
      <form onSubmit={this.onSubmit}>
        <FocusContainer focusOnMount containFocus={false}>
          <CardText>
            <PasswordTextField
              id="new-password"
              name="newPassword"
              label="New password"
              value={passwordResetConfirmation.newPassword}
              minLength={schemaSettings.passwordMinLength}
              maxLength={schemaSettings.passwordMaxLength}
              onPropertyChange={this.onPropertyChange}
              onBlur={this.onBlur}
              onSubmit={this.onSubmit}
              disabled={isSubmitting}
              required
              error={(dirty.newPassword || wasSubmitAttempted) && !!validationErrors.newPassword}
              errorText={validationErrors.password && 'Please enter a valid password (6 characters or more)'}
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
              children="Change Password"
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
          Your password has been changed.
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

    const errorMessage = passwordResetErrorMessageByCode[errorCode]

    const formWithNotice = (
      <React.Fragment>
        <CardText>
          Please change the password for <strong>{email}</strong>
        </CardText>
        {errorNoticeMessage &&
          <CardText className="error-message">
            {errorNoticeMessage}
          </CardText>
        }
        {form}
      </React.Fragment>
    )

    return (
      <div id="password-reset-confirmation-page">
        <Helmet>
          <title>Password Reset — Howdju</title>
        </Helmet>
        <div className="md-grid">
          <div className="md-cell md-cell--12">
            <Card>
              <CardTitle
                title="Password Reset"
                subtitle={subtitle}
              />
              {!didCheck && (
                <CardText>
                  Checking password reset code…
                  <CircularProgress id="checking-password-reset-code-progress"/>
                </CardText>
              )}
              {didCheck && !isSubmitted && !errorCode && formWithNotice}
              {didCheck && errorCode && errorMessage}
              {isSubmitted && !errorCode && confirmedMessage}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  onPropertyChange = (properties) => {
    this.props.pages.passwordResetConfirmationPropertyChange(properties)
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
    this.props.api.confirmPasswordReset(this.props.passwordResetCode, this.props.passwordResetConfirmation)
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

const passwordResetErrorMessageByCode = {
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
  const queryParams = queryString.parse(ownProps.location.search)
  const passwordResetCode = queryParams.passwordResetCode
  const pageState = selectPasswordResetConfirmationPage(state)
  return {
    passwordResetCode,
    ...pageState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  pages,
}, {
  goBack,
}))(PasswordResetConfirmationPage)
