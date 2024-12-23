import { mapValues } from "lodash";
import { all } from "redux-saga/effects";

import {
  flagRehydrate,
  cancelResourceApiCalls,
  resourceApiCalls,
} from "howdju-client-common";

import { mediaExcerptApparitionsDialogSaga } from "@/components/mediaExcerptApparitionsDialog/mediaExcerptApparitionsDialogSlice";
import { propositionAppearancesDialogSaga } from "@/components/propositionAppearancesDialog/propositionAppearancesDialogSlice";
import { explorePageSaga } from "@/pages/explore/explorePageSlice";
import { factCheckPageSaga } from "@/pages/factChecks/factCheckPageSlice";
import { mediaExcerptUsagesSaga } from "@/pages/mediaExcerpt/mediaExcerptUsagesSlice";
import { passwordResetConfirmationPageSaga } from "@/pages/passwordResetConfirmation/passwordResetConfirmationPageSlice";
import { passwordResetRequestPageSaga } from "@/pages/passwordResetRequest/passwordResetRequestPageSlice";
import * as appSagas from "../app/appSagas";
import * as justificationsPageSagas from "../pages/justifications/justificationPageSagas";
import * as justificationsSearchPageSagas from "../pages/justificationsSearch/justificationsSearchPageSagas";
import { sendPageView } from "./analyticsSagas";
import {
  configureAfterLogin,
  configureAfterLogout,
  configureAfterRehydrate,
  refreshAuthAfterRehydrate,
} from "./configureSagas";
import { beginEditOfMediaExcerptFromInfo } from "./editors/beginEditOfMediaExcerptFromInfoSaga";
import { commitEditorThenView } from "./editors/commitEditorThenViewSaga";
import { commitEditThenPutActionOnSuccess } from "./editors/commitEditThenPutActionOnSuccessSaga";
import { editorCommitEdit } from "./editors/editorCommitEditSaga";
import { fetchAndBeginEditOfNewJustificationFromBasisSource } from "./editors/fetchAndBeginEditOfNewJustificationFromBasisSourceSaga";
import { inferMediaExcerptInfo } from "./editors/inferMediaExcerptInfoSaga";
import { postExtensionMessages } from "./extensionSagas";
import {
  apiActionOnSuccess,
  apiActionOnSuccessResponse,
  goTo,
  redirectAfterLogin,
  redirectHomeFromMissingRootTarget,
  redirectToLoginWhenUnauthenticated,
  redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication,
} from "./flowSagas";

export default () =>
  all([
    all(mapValues(appSagas, (s) => s())),
    all(mapValues(justificationsSearchPageSagas, (s) => s())),
    all(mapValues(justificationsPageSagas, (s) => s())),

    resourceApiCalls(),
    cancelResourceApiCalls(),

    flagRehydrate(),

    configureAfterLogin(),
    configureAfterRehydrate(),
    configureAfterLogout(),
    refreshAuthAfterRehydrate(),

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

    sendPageView(),

    postExtensionMessages(),

    inferMediaExcerptInfo(),

    passwordResetRequestPageSaga(),
    passwordResetConfirmationPageSaga(),

    propositionAppearancesDialogSaga(),
    mediaExcerptApparitionsDialogSaga(),

    explorePageSaga(),
  ]);
