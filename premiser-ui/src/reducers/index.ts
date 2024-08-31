import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router";
import { History } from "history";

import { primaryContextTrail } from "@/components/contextTrail/primaryContextTrailSlice";
import listEntities from "@/components/listEntities/listEntitiesReducer";
import { mediaExcerptApparitionsDialog } from "@/components/mediaExcerptApparitionsDialog/mediaExcerptApparitionsDialogSlice";
import { propositionAppearancesDialog } from "@/components/propositionAppearancesDialog/propositionAppearancesDialogSlice";
import { urlLocatorsEditorFields } from "@/editors/urlLocatorsEditorFieldsSlice";
import { accountSettingsPage } from "@/pages/accountSettings/accountSettingsPageSlice";
import { createAppearancePage } from "@/pages/appearances/createAppearancePageSlice";
import { explorePage } from "@/pages/explore/explorePageSlice";
import { factCheckPage } from "@/pages/factChecks/factCheckPageSlice";
import { justificationsPage } from "@/pages/justifications/justificationsPageSlice";
import { justificationsSearchPage } from "@/pages/justificationsSearch/justificationsSearchPageSlice";
import { mediaExcerptPage } from "@/pages/mediaExcerpt/mediaExcerptPageSlice";
import { mediaExcerptUsages } from "@/pages/mediaExcerpt/mediaExcerptUsagesSlice";
import { mediaExcerptsSearchPage } from "@/pages/mediaExcerptsSearch/mediaExcerptsSearchPageSlice";
import { passwordResetConfirmationPage } from "@/pages/passwordResetConfirmation/passwordResetConfirmationPageSlice";
import { passwordResetRequestPage } from "@/pages/passwordResetRequest/passwordResetRequestPageSlice";
import { persorgPage } from "@/pages/persorg/persorgPageSlice";
import { propositionUsagesPage } from "@/pages/propositionUsages/propositionUsagesPageSlice";
import { registrationConfirmationPage } from "@/pages/registration/registrationConfirmationPageSlice";
import { sourcePage } from "@/pages/source/sourcePageSlice";
import { tagPage } from "@/pages/tag/tagPageSlice";
import { app } from "../app/appSlice";
import { mainSearch } from "../components/mainSearchBox/mainSearchBoxSlice";
import { mainSearchPage } from "../pages/mainSearch/mainSearchPageSlice";
import auth from "./auth";
import currentUser from "./currentUser";
import autocompletes from "./autocompletes";
import editors from "./editors";
import entities from "./entities";
import privacyConsent from "./privacyConsent";

const widgets = combineReducers({
  listEntities,
});

export default (history: History) =>
  combineReducers({
    accountSettingsPage,
    app,
    auth,
    autocompletes,
    createAppearancePage,
    currentUser,
    editors,
    entities,
    explorePage,
    factCheckPage,
    justificationsPage,
    justificationsSearchPage,
    mainSearch,
    mainSearchPage,
    mediaExcerptPage,
    mediaExcerptsSearchPage,
    passwordResetConfirmationPage,
    passwordResetRequestPage,
    persorgPage,
    primaryContextTrail,
    privacyConsent,
    propositionAppearancesDialog,
    propositionUsagesPage,
    mediaExcerptApparitionsDialog,
    mediaExcerptUsages,
    registrationConfirmationPage,
    router: connectRouter(history),
    sourcePage,
    tagPage,
    urlLocatorsEditorFields,
    widgets,
  });
