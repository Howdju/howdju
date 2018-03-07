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
  checkAuthExpiration,
} from './appSagas'
import {logErrors} from './logErrorsSaga'
import {
  goHomeIfDeleteStatementWhileViewing,
  goTo,
  redirectAfterLogin,
  redirectHomeFromMissingStatement,
  redirectToLoginWhenUnauthorized,
  clearAuthTokenWhenUnauthorized,
} from './flowSagas'
import {searchMainSearch} from './searchMainSearchSaga'
import {commitEditorThenView} from './editors/commitEditorThenViewSaga'
import {commitEditThenPutActionOnSuccess} from './editors/commitEditThenPutActionOnSuccessSaga'
import {fetchAndBeginEditOfNewJustificationFromBasisSource} from './editors/fetchAndBeginEditOfNewJustificationFromBasisSourceSaga'
import {editorCommitEdit} from './editors/editorCommitEditSaga'


export default () => [

  resourceApiCalls(),
  cancelResourceApiCalls(),
  searchMainSearch(),

  flagRehydrate(),
  checkAuthExpirationOnRehydrate(),
  checkAuthExpirationPeriodically(),
  checkAuthExpiration(),
  logErrors(),

  configureAfterLogin(),
  configureAfterRehydrate(),

  clearAuthTokenWhenUnauthorized(),

  goTo(),
  redirectToLoginWhenUnauthorized(),
  redirectAfterLogin(),
  goHomeIfDeleteStatementWhileViewing(),
  redirectHomeFromMissingStatement(),
  commitEditorThenView(),
  commitEditThenPutActionOnSuccess(),
  fetchAndBeginEditOfNewJustificationFromBasisSource(),

  editorCommitEdit(),

  apiFailureAlerts(),
  showAlertForUnexpectedApiError(),
  showAlertForExtantEntities(),
  showAlertForLogin(),
  showAlertForLogout(),

  handleTransientInteractions(),

  sendPageView(),
]
