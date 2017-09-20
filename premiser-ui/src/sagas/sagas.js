import handleTransientInteractions from './transientSagas'
import {
  cancelResourceApiCalls,
  resourceApiCalls,
} from './resourceApiSagas'
import {flagRehydrate} from './apiSagas'
import {configureAfterLogin, configureAfterRehydrate} from './configureSagas'
import {
  apiFailureAlerts,
  showAlertForExtantEntities,
  showAlertForLogin,
  showAlertForLogout,
  showAlertForUnexpectedApiError
} from './alertSagas'
import {sendPageView} from './analyticsSagas'
import {logErrors} from './logErrorsSaga'
import {
  goHomeIfDeleteStatementWhileViewing,
  goTo,
  redirectAfterLogin,
  redirectHomeFromMissingStatement,
  redirectToLoginWhenUnauthorized
} from './flowSagas'
import {fetchMainSearchResults} from './fetchMainSearchResultsSaga'
import {commitEditorThenView} from './editors/commitEditorThenViewSaga'
import {commitEditThenPutActionOnSuccess} from './editors/commitEditThenPutActionOnSuccessSaga'
import {fetchAndBeginEditOfNewJustificationFromBasisSource} from './editors/fetchAndBeginEditOfNewJustificationFromBasisSourceSaga'
import {editorCommitEdit} from './editors/editorCommitEditSaga'


export default () => [

  resourceApiCalls(),
  cancelResourceApiCalls(),
  fetchMainSearchResults(),

  flagRehydrate(),
  logErrors(),

  configureAfterLogin(),
  configureAfterRehydrate(),

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
