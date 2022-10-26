import get from 'lodash/get'
import {normalize} from 'normalizr'
import {handleActions, combineActions} from "redux-actions"

import {
  EntityTypes,
  httpStatusCodes,
} from 'howdju-common'

import {
  api,
  pages,
  ui,
} from '../../actions'


const defaultPersorgPageState = {
  statements: [],
  isFetching: false,
}
export const persorgPage = handleActions({
  [api.fetchSpeakerStatements]: (state, action) => ({
    ...state,
    isFetching: true,
  }),
  [api.fetchSpeakerStatements.response]: {
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        statements: result.statements,
        isFetching: false
      }
    },
    throw: (state, action) => ({
      ...state,
      statements: [],
      isFetching: false
    }),
  },
  [ui.clearPersorgStatements]: (state, action) => ({
    ...state,
    ...defaultPersorgPageState
  }),
}, defaultPersorgPageState)


const defaultAccountSettingsPageState = {
  accountSettings: null,
  isFetching: false,
}
export const accountSettingsPage = handleActions({
  [api.fetchAccountSettings]: (state, action) => ({
    ...state,
    isFetching: true,
  }),
  [api.fetchAccountSettings.response]: {
    next: (state, action) => {
      return {
        ...state,
        accountSettings: action.payload.accountSettings,
        isFetching: false
      }
    },
    throw: (state, action) => ({
      ...state,
      accountSettings: null,
      isFetching: false
    }),
  },
  [api.updateAccountSettings.response]: {
    next: (state, action) => {
      return {
        ...state,
        accountSettings: action.payload.accountSettings,
      }
    },
  },
}, defaultAccountSettingsPageState)



export const propositionUsagesPage = handleActions({
  [api.fetchSentenceStatements]: {
    next: (state, action) => ({
      ...state,
      isFetchingDirect: true,
      directStatements: [],
    })
  },
  [api.fetchSentenceStatements.response]: {
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        isFetchingDirect: false,
        directStatements: result.statements,
      }
    }
  },
  [api.fetchIndirectPropositionStatements]: {
    next: (state, action) => ({
      ...state,
      isFetchingIndirect: true,
      indirectStatements: []
    })
  },
  [api.fetchIndirectPropositionStatements.response]: {
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        isFetchingIndirect: false,
        indirectStatements: result.statements,
      }
    }
  },
  [api.fetchJustificationsSearch]: (state, action) => ({
    ...state,
    isFetchingJustifications: true,
  }),
  [api.fetchJustificationsSearch.response]: {
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        justifications: result.justifications,
        continuationToken: action.payload.continuationToken,
        isFetchingJustifications: false,
      }
    },
    throw: (state, action) => ({...state, isFetchingJustifications: false}),
  },
}, {
  isFetching: false,
  directStatements: [],
  indirectStatements: [],
})

export const registrationConfirmationPage = handleActions({
  [combineActions(
    api.checkRegistration.response,
    api.confirmRegistration.response,
  )]: {
    next: (state, action) => ({...state, email: action.payload.email, didCheckRegistration: true, registrationErrorCode: null}),
    throw: (state, action) =>
      ({...state, didCheckRegistration: true, registrationErrorCode: get(action, 'payload.body.errorCode')}),
  },
}, {
  didCheckRegistration: false,
  registrationErrorCode: null,
})

const passwordResetRequestPageDefaultState = {
  passwordResetRequest: {email: ''},
  duration: null,
  isSubmitting: false,
  isSubmitted: false,
  errors: {},
}
export const passwordResetRequestPage = handleActions({
  [pages.beginPasswordResetRequest]: (state, action) => ({...passwordResetRequestPageDefaultState}),
  [pages.passwordResetRequestPropertyChange]: (state, action) => {
    const passwordResetRequest = {...state.passwordResetRequest, ...action.payload.properties}
    return {...state, passwordResetRequest}
  },
  [api.requestPasswordReset]: (state, action) => ({...state, isSubmitting: true}),
  [api.requestPasswordReset.response]: {
    next: (state, action) => ({
      ...state,
      duration: action.payload.duration,
      isSubmitting: false,
      isSubmitted: true,
    }),
    throw: (state, action) => {
      const errors = {}
      if (
        action.payload.httpStatusCode === httpStatusCodes.NOT_FOUND &&
        action.payload.body.entityType === EntityTypes.USER &&
        get(action, 'payload.body.identifier.email')
      ) {
        errors.email = {value: get(action, 'payload.body.identifier.email')}
      }
      return {...state, isSubmitting: false, isSubmitted: false, errors}
    }
  },
}, passwordResetRequestPageDefaultState)

const passwordResetConfirmationPageDefaultState = {
  passwordResetConfirmation: {newPassword: ''},
  isSubmitting: false,
  isSubmitted: false,
  didCheck: false,
  errorCode: null,
}
export const passwordResetConfirmationPage = handleActions({
  [pages.beginPasswordResetConfirmation]: (state, action) => ({...passwordResetConfirmationPageDefaultState}),
  [pages.passwordResetConfirmationPropertyChange]: (state, action) => {
    const passwordResetConfirmation = {...state.passwordResetConfirmation, ...action.payload.properties}
    return {...state, passwordResetConfirmation}
  },
  [api.confirmPasswordReset]: (state, action) => ({...state, isSubmitting: true}),
  [api.confirmPasswordReset.response]: (state, action) => ({...state, isSubmitting: false, isSubmitted: true}),
  [combineActions(
    api.checkPasswordResetRequest.response,
    api.confirmPasswordReset.response,
  )]: {
    next: (state, action) => ({...state, email: action.payload.email, didCheck: true, errorCode: null}),
    throw: (state, action) =>
      ({...state, didCheck: true, errorCode: get(action, 'payload.body.errorCode')}),
  },
}, passwordResetConfirmationPageDefaultState)
