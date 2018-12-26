import {all} from 'redux-saga/effects'

import handleTransientInteractions from './transientSagas'
import {
  cancelResourceApiCalls,
  resourceApiCalls,
} from './resourceApiSagas'
import {configureAfterLogin, configureAfterRehydrate} from './configureSagas'
import {
  apiFailureAlerts,
  showAlertForExtantEntities,
  showAlertForLogin,
  showAlertForLogout,
  showAlertForUnexpectedApiError
} from './alertSagas'
import {sendPageView} from './analyticsSagas'
import {
  flagRehydrate,
  checkAuthExpirationOnRehydrate,
  checkAuthExpirationPeriodically,
  checkAuthExpiration, resetJustificationSearchPage, resetTagPage,
} from './appSagas'
import {logErrors} from './logErrorsSaga'
import {
  goHomeIfDeletePropositionWhileViewing,
  goTo,
  redirectAfterLogin,
  redirectHomeFromMissingRootTarget,
  redirectToLoginWhenUnauthenticated,
  clearAuthTokenWhenUnauthorized,
  redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication,
} from './flowSagas'
import {searchMainSearch} from './searchMainSearchSaga'
import {commitEditorThenView} from './editors/commitEditorThenViewSaga'
import {commitEditThenPutActionOnSuccess} from './editors/commitEditThenPutActionOnSuccessSaga'
import {fetchAndBeginEditOfNewJustificationFromBasisSource} from './editors/fetchAndBeginEditOfNewJustificationFromBasisSourceSaga'
import {editorCommitEdit} from './editors/editorCommitEditSaga'
import {beginEditOfNewJustificationFromAnchor} from './editors/beginEditOfNewJustificationFromAnchorSaga'
import {deleteJustificationRootTargetTranslator} from './entitiesSagas'


export default () => all([

  resourceApiCalls(),
  cancelResourceApiCalls(),
  searchMainSearch(),

  flagRehydrate(),
  checkAuthExpirationOnRehydrate(),
  checkAuthExpirationPeriodically(),
  checkAuthExpiration(),
  logErrors(),

  resetJustificationSearchPage(),
  resetTagPage(),

  configureAfterLogin(),
  configureAfterRehydrate(),

  clearAuthTokenWhenUnauthorized(),

  goTo(),
  redirectToLoginWhenUnauthenticated(),
  redirectAfterLogin(),
  goHomeIfDeletePropositionWhileViewing(),
  redirectHomeFromMissingRootTarget(),
  commitEditorThenView(),
  commitEditThenPutActionOnSuccess(),
  fetchAndBeginEditOfNewJustificationFromBasisSource(),
  redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication(),
  beginEditOfNewJustificationFromAnchor(),

  editorCommitEdit(),

  apiFailureAlerts(),
  showAlertForUnexpectedApiError(),
  showAlertForExtantEntities(),
  showAlertForLogin(),
  showAlertForLogout(),

  handleTransientInteractions(),

  deleteJustificationRootTargetTranslator(),

  sendPageView(),
])
