import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router";
import { History } from "history";

import { app } from "../app/appSlice";
import auth from "./auth";
import autocompletes from "./autocompletes";
import editors from "./editors";
import entities from "./entities";
import errors from "./errors";
import privacyConsent from "./privacyConsent";
import ui from "./ui";
import widgets from "./widgets";
import { mainSearch } from "../components/mainSearchBox/mainSearchBoxSlice";
import { mainSearchPage } from "../pages/mainSearch/mainSearchPageSlice";
import { justificationsSearchPage } from "@/pages/justificationsSearch/justificationsSearchPageSlice";
import { tagPage } from "@/pages/tag/tagPageSlice";
import { persorgPage } from "@/pages/persorg/persorgPageSlice";
import { justificationsPage } from "@/pages/justifications/justificationsPageSlice";
import { accountSettingsPage } from "@/pages/accountSettings/accountSettingsPageSlice";
import { propositionUsagesPage } from "@/pages/propositionUsages/propositionUsagesPageSlice";
import { registrationConfirmationPage } from "@/pages/registration/registrationConfirmationPageSlice";
import { primaryContextTrail } from "@/components/contextTrail/primaryContextTrailSlice";

export default (history: History) =>
  combineReducers({
    accountSettingsPage,
    app,
    auth,
    autocompletes,
    editors,
    entities,
    errors,
    justificationsPage,
    justificationsSearchPage,
    mainSearch,
    mainSearchPage,
    persorgPage,
    primaryContextTrail,
    privacyConsent,
    propositionUsagesPage,
    registrationConfirmationPage,
    router: connectRouter(history),
    tagPage,
    ui,
    widgets,
  });
