import React, {FocusEvent, FormEvent, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {goBack} from 'connected-react-router'
import {
  Button,
  Card,
  CardActions,
  CardText,
  CardTitle,
  CircularProgress,
  FocusContainer,
} from 'react-md'
import get from 'lodash/get'
import moment from 'moment'
import cn from 'classnames'

import {
  EntityErrorCodes,
  makeRegistrationRequest,
  schemaSettings,
  schemas,
  EmptyBespokeValidationErrors,
  onlyFieldError,
} from 'howdju-common'
import {emptyValidationResult, validate} from 'howdju-ajv-sourced'

import Helmet from '../../Helmet'
import {editors} from '../../actions'
import EmailTextField from '../../EmailTextField'
import paths from '../../paths'
import {EditorTypes} from '../../reducers/editors'
import {useAppDispatch, useAppSelector} from '@/hooks'
import {PropertyChanges} from '@/types'

const editorId = 'registration-request-page'
const editorType = EditorTypes.REGISTRATION_REQUEST

export default function RegistrationRequestPage() {
  const dispatch = useAppDispatch()

  const onPropertyChange = (properties: PropertyChanges) => {
    dispatch(editors.propertyChange(editorType, editorId, properties))
  }

  const onBlur = (event: FocusEvent<HTMLInputElement>) => {
    const name = event.target.name
    dispatch(editors.blurField(editorType, editorId, name))
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    dispatch(editors.commitEdit(editorType, editorId))
  }

  const reset = () => {
    dispatch(goBack())
  }

  useEffect(() => {
    dispatch(editors.beginEdit(editorType, editorId, makeRegistrationRequest()))
  }, [])

  const editorState = useAppSelector(state => get(state, ['editors', editorType, editorId]))

  if (!editorState) {
    return <CircularProgress id={editorId} />
  }

  const dirtyFields = get(editorState, 'dirtyFields')
  const wasSubmitAttempted = get(editorState, 'wasSubmitAttempted')
  const isSubmitting = get(editorState, 'isSaving')
  const isSubmitted = get(editorState, 'isSaved')
  const remoteErrors = get(editorState, 'errors', EmptyBespokeValidationErrors)
  const duration = get(editorState, 'duration')

  const registration = get(editorState, 'editEntity')
  const email = get(registration, 'email', '')

  const {errors: localErrors, isValid} = registration
    ? validate(schemas.registrationRequest, registration)
    : emptyValidationResult(schemas.registrationRequest)

  const errorMessage = !wasSubmitAttempted || isValid ? null : 'Please correct the errors below'

  const submitButtonTitle = isValid
    ? 'Register'
    : wasSubmitAttempted
    ? 'Please correct the errors to continue'
    : 'Please complete the form to continue'

  const emailConflictError = onlyFieldError(
    remoteErrors.fieldErrors.email,
    EntityErrorCodes.EMAIL_TAKEN,
  )

  const form = (
    <form onSubmit={onSubmit}>
      <FocusContainer focusOnMount containFocus={false}>
        <CardText>
          <EmailTextField
            id="email"
            name="email"
            autocomplete="email"
            value={email}
            maxLength={schemaSettings.userEmailMaxLength}
            onBlur={onBlur}
            onSubmit={onSubmit}
            onPropertyChange={onPropertyChange}
            disabled={isSubmitting}
            required
            error={
              (dirtyFields.email || wasSubmitAttempted) &&
              (!!localErrors.email || remoteErrors?.fieldErrors?.email)
            }
            errorText={
              <React.Fragment>
                {localErrors.email && 'Please enter a valid email.'}
                {emailConflictError?.value === email && (
                  <span>
                    That email is already registered. Please{' '}
                    <Link className="text-link" to={paths.login()}>
                      login
                    </Link>{' '}
                    to continue with this email.
                  </span>
                )}
              </React.Fragment>
            }
          />
        </CardText>
        <CardActions>
          {isSubmitting && <CircularProgress key="progress" id="progress" />}
          <Button flat children="Cancel" disabled={isSubmitting} onClick={reset} />
          <Button
            raised={isValid}
            flat={!isValid}
            primary={isValid}
            type="submit"
            children="Register"
            disabled={isSubmitting}
            title={submitButtonTitle}
            className={cn({'md-btn--raised-disabled': !isValid, 'md-text--disabled': !isValid})}
          />
        </CardActions>
      </FocusContainer>
    </form>
  )

  const durationText =
    duration &&
    moment.duration(duration.value).format(duration.formatTemplate, {trim: duration.formatTrim})
  const submissionMessage = (
    <React.Fragment>
      <CardText>
        Your registration has been submitted. Please check your email to complete your registration.
        You must complete your registration within {durationText}. If your registration expires,
        please register again.
      </CardText>
      <CardActions>
        <Button raised primary children="Return" onClick={reset} />
      </CardActions>
    </React.Fragment>
  )

  return (
    <div id="register-page">
      <Helmet>
        <title>Request Registration — Howdju</title>
      </Helmet>
      <div className="md-grid">
        <div className="md-cell md-cell--12">
          <Card>
            <CardTitle title="Register" />
            {errorMessage && <CardText className="error-message">{errorMessage}</CardText>}
            {isSubmitted ? submissionMessage : form}
          </Card>
        </div>
      </div>
    </div>
  )
}
