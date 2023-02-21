import { all } from "redux-saga/effects";
import { mapValues } from "lodash";

import handleTransientInteractions from "./transientSagas";
import { cancelResourceApiCalls, resourceApiCalls } from "./resourceApiSagas";
import {
  configureAfterLogin,
  configureAfterRehydrate,
  configureAfterLogout,
} from "./configureSagas";
import { sendPageView } from "./analyticsSagas";
import {
  flagRehydrate,
  checkAuthExpirationOnRehydrate,
  checkAuthExpirationPeriodically,
  checkAuthExpiration,
} from "./appSagas";
import { logErrors } from "./logErrorsSaga";
import {
  goHomeIfDeletePropositionWhileViewing,
  goTo,
  redirectAfterLogin,
  redirectHomeFromMissingRootTarget,
  redirectToLoginWhenUnauthenticated,
  clearAuthTokenWhenUnauthorized,
  redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication,
} from "./flowSagas";
import { commitEditorThenView } from "./editors/commitEditorThenViewSaga";
import { commitEditThenPutActionOnSuccess } from "./editors/commitEditThenPutActionOnSuccessSaga";
import { fetchAndBeginEditOfNewJustificationFromBasisSource } from "./editors/fetchAndBeginEditOfNewJustificationFromBasisSourceSaga";
import { editorCommitEdit } from "./editors/editorCommitEditSaga";
import { beginEditOfNewJustificationFromTarget } from "./editors/beginEditOfNewJustificationFromTargetSaga";
import {
  deleteJustificationRootTargetTranslator,
  fetchJustificationTargets,
} from "./apiLikeSagas";
import { contentScriptAck, postExtensionMessages } from "./extensionSagas";
import * as appSagas from "../app/appSagas";
import * as justificationsSearchPageSagas from "../pages/justificationsSearch/justificationsSearchPageSagas";
import * as justificationsPageSagas from "../pages/justifications/justificationPageSagas";

export default () =>
  all([
    all(mapValues(appSagas, (s) => s())),
    all(mapValues(justificationsSearchPageSagas, (s) => s())),
    all(mapValues(justificationsPageSagas, (s) => s())),

    resourceApiCalls(),
    cancelResourceApiCalls(),

    flagRehydrate(),
    checkAuthExpirationOnRehydrate(),
    checkAuthExpirationPeriodically(),
    checkAuthExpiration(),
    logErrors(),

    configureAfterLogin(),
    configureAfterRehydrate(),
    configureAfterLogout(),

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
    beginEditOfNewJustificationFromTarget(),

    deleteJustificationRootTargetTranslator(),
    fetchJustificationTargets(),

    editorCommitEdit(),

    handleTransientInteractions(),

    sendPageView(),

    postExtensionMessages(),
    contentScriptAck(),
  ]);
