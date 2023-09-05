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
  apiActionOnSuccess,
  apiActionOnSuccessResponse,
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
import { beginEditOfMediaExcerptFromInfo } from "./editors/beginEditOfMediaExcerptFromInfoSaga";
import { postExtensionMessages } from "./extensionSagas";
import { inferMediaExcerptInfo } from "./editors/inferMediaExcerptInfoSaga";
import * as appSagas from "../app/appSagas";
import * as justificationsSearchPageSagas from "../pages/justificationsSearch/justificationsSearchPageSagas";
import * as justificationsPageSagas from "../pages/justifications/justificationPageSagas";
import { factCheckPageSaga } from "@/pages/factChecks/factCheckPageSlice";
import { mediaExcerptUsagesSaga } from "@/pages/mediaExcerpt/mediaExcerptUsagesSlice";
import { passwordResetRequestPageSaga } from "@/pages/passwordResetRequest/passwordResetRequestPageSlice";
import { passwordResetConfirmationPageSaga } from "@/pages/passwordResetConfirmation/passwordResetConfirmationPageSlice";
import { propositionAppearancesDialogSaga } from "@/components/propositionAppearancesDialog/propositionAppearancesDialogSlice";
import { mediaExcerptApparitionsDialogSaga } from "@/components/mediaExcerptApparitionsDialog/mediaExcerptApparitionsDialogSlice";

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
    apiActionOnSuccess(),
    apiActionOnSuccessResponse(),
    redirectHomeFromMissingRootTarget(),
    commitEditorThenView(),
    commitEditThenPutActionOnSuccess(),
    fetchAndBeginEditOfNewJustificationFromBasisSource(),
    redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication(),
    beginEditOfMediaExcerptFromInfo(),

    factCheckPageSaga(),
    mediaExcerptUsagesSaga(),

    editorCommitEdit(),

    handleTransientInteractions(),

    sendPageView(),

    postExtensionMessages(),

    inferMediaExcerptInfo(),

    passwordResetRequestPageSaga(),
    passwordResetConfirmationPageSaga(),

    propositionAppearancesDialogSaga(),
    mediaExcerptApparitionsDialogSaga(),
  ]);
