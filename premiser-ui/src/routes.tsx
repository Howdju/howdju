import React, { ReactElement } from "react";
import reduce from "lodash/reduce";
import { Route, RouteProps } from "react-router";
import { pathToRegexp, Key as PathToRegexpKey } from "path-to-regexp";

import { JustificationRootTargetTypes, commonPaths } from "howdju-common";

import AccountSettingsPage from "./pages/accountSettings/AccountSettingsPage";
import AboutPage from "./AboutPage";
import CreatePropositionPage from "./CreatePropositionPage";
import { history } from "./history";
import IconPage from "./IconPage";
import JustificationsPage from "./pages/justifications/JustificationsPage";
import JustificationsSearchPage from "./pages/justificationsSearch/JustificationsSearchPage";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import mainSearcher from "./mainSearcher";
import MainSearchPage from "./pages/mainSearch/MainSearchPage";
import NotFoundPage from "./NotFoundPage";
import PasswordResetRequestPage from "./PasswordResetRequestPage";
import PasswordResetConfirmationPage from "./PasswordResetConfirmationPage";
import paths, { createJustificationPath } from "./paths";
import PersorgPage from "./pages/persorg/PersorgPage";
import PrivacySettingsPage from "./PrivacySettingsPage";
import PoliciesOverviewPage from "./policies/PoliciesOverviewPage";
import PolicyPage from "./policies/PolicyPage";
import PropositionUsagesPage from "./pages/propositionUsages/PropositionUsagesPage";
import RecentActivityPage from "./RecentActivityPage";
import RegistrationConfirmationPage from "./pages/registration/RegistrationConfirmationPage";
import RegistrationRequestPage from "./pages/registration/RegistrationRequestPage";
import SourcePage from "./pages/source/SourcePage";
import SubmitMediaExcerptPage from "./pages/SubmitMediaExcerptPage";
import TagPage from "./pages/tag/TagPage";
import TestErrorPage from "./TestErrorPage";
import ToolsPage from "./ToolsPage";
import WhatsNextPage from "./WhatsNextPage";

import principlesInnerHtml from "./policies/principles.md";
import userAgreementInnerHtml from "./policies/user-agreement.md";
import codeOfConductInnerHtml from "./policies/code-of-conduct.md";
import privacyPolicyInnerHtml from "./policies/privacy-policy.md";
import cookieNoticeInnerHtml from "./policies/cookie-notice.md";
import faqInnerHtml from "./policies/faq.md";
import WritQuotePage from "./pages/WritQuotePage";
import { map } from "lodash";
import { CreatePropositionPageMode } from "./types";
import { Location, LocationState } from "history";
import { PrimaryContextTrailProvider } from "./components/contextTrail/PrimaryContextTrailProvider";
import MediaExcerptPage from "./pages/mediaExcerpt/MediaExcerptPage";
import MediaExcerptUsagesPage from "./pages/mediaExcerptUsages/MediaExcerptUsagesPage";
import CreateAppearancePage from "./pages/appearances/CreateAppearancePage";
import AppearancePage from "./pages/appearances/AppearancePage";
import FactCheckPage from "./pages/factChecks/FactCheckPage";

const renderHomePath = (props: RouteProps) => {
  const mainSearchText =
    props.location && mainSearcher.mainSearchText(props.location);
  return mainSearchText ? <MainSearchPage /> : <LandingPage />;
};

const routesById = {
  home: <Route exact path={paths.home()} render={renderHomePath} />,
  login: <Route exact path={paths.login()} component={LoginPage} />,
  requestRegistration: (
    <Route
      exact
      path={paths.requestRegistration()}
      component={RegistrationRequestPage}
    />
  ),
  confirmRegistration: (
    <Route
      exact
      path={commonPaths.confirmRegistration()}
      component={RegistrationConfirmationPage}
    />
  ),
  requestPasswordReset: (
    <Route
      exact
      path={paths.requestPasswordReset()}
      component={PasswordResetRequestPage}
    />
  ),
  confirmPasswordReset: (
    <Route
      exact
      path={commonPaths.confirmPasswordReset()}
      component={PasswordResetConfirmationPage}
    />
  ),

  recentActivity: (
    <Route exact path={paths.recentActivity()} component={RecentActivityPage} />
  ),
  whatsNext: <Route exact path={paths.whatsNext()} component={WhatsNextPage} />,
  about: <Route exact path={paths.about()} component={AboutPage} />,

  writQuote: (
    <Route
      exact
      path="/writ-quotes/:writQuoteId/:slug?"
      component={WritQuotePage}
    />
  ),
  proposition: (
    <Route
      exact
      path="/p/:rootTargetId/:slug?"
      render={(props) => (
        <PrimaryContextTrailProvider {...props}>
          <JustificationsPage
            {...props}
            rootTargetType={JustificationRootTargetTypes.PROPOSITION}
          />
        </PrimaryContextTrailProvider>
      )}
    />
  ),
  statement: (
    <Route
      exact
      path="/s/:rootTargetId/:slug?"
      render={(props) => (
        <JustificationsPage
          {...props}
          rootTargetType={JustificationRootTargetTypes.STATEMENT}
        />
      )}
    />
  ),
  persorg: (
    <Route exact path="/persorgs/:persorgId/:slug?" component={PersorgPage} />
  ),
  source: (
    <Route exact path="/sources/:sourceId/:slug?" component={SourcePage} />
  ),
  tag: <Route exact path="/tags/:tagId/:tagSlug?" component={TagPage} />,
  searchJustifications: (
    <Route
      exact
      path="/search-justifications"
      component={JustificationsSearchPage}
    />
  ),
  propositionUsages: (
    <Route exact path="/proposition-usages" component={PropositionUsagesPage} />
  ),
  mediaExcerptUsages: (
    <Route
      exact
      path="/media-excerpts/:mediaExcerptId/usages"
      component={MediaExcerptUsagesPage}
    />
  ),

  submitMediaExcerpt: (
    <Route
      exact
      path="/media-excerpts/new"
      component={SubmitMediaExcerptPage}
    />
  ),
  mediaExcerpt: (
    <Route
      exact
      path="/media-excerpts/:mediaExcerptId/:slug?"
      component={MediaExcerptPage}
    />
  ),

  createProposition: (
    <Route
      exact
      path="/create-proposition"
      render={(props) => (
        <CreatePropositionPage
          {...props}
          mode={CreatePropositionPageMode.CREATE_PROPOSITION}
        />
      )}
    />
  ),
  createJustification: (
    <Route
      exact
      path={createJustificationPath}
      render={(props) => (
        <CreatePropositionPage
          {...props}
          mode={CreatePropositionPageMode.CREATE_JUSTIFICATION}
        />
      )}
    />
  ),
  createAppearance: (
    <Route
      exact
      path="/media-excerpts/:mediaExcerptId/appearances/new"
      component={CreateAppearancePage}
    />
  ),
  appearance: (
    <Route
      exact
      path="/media-excerpts/:mediaExcerptId/appearances/:appearanceId/"
      component={AppearancePage}
    />
  ),
  factCheck: <Route exact path="/fact-checks/" component={FactCheckPage} />,
  submitJustificationViaQueryString: (
    <Route
      exact
      path="/submit"
      render={(props) => (
        <CreatePropositionPage
          {...props}
          mode={CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING}
        />
      )}
    />
  ),

  settings: <Route exact path="/settings" component={AccountSettingsPage} />,
  privacySettings: (
    <Route exact path="/settings/privacy" component={PrivacySettingsPage} />
  ),
  tools: <Route exact path="/tools" component={ToolsPage} />,

  policiesOverview: (
    <Route
      exact
      path={paths.policiesOverview()}
      component={PoliciesOverviewPage}
    />
  ),
  values: (
    <Route
      exact
      path={paths.principles()}
      render={() => (
        <PolicyPage pageTitle="Principles" innerHtml={principlesInnerHtml} />
      )}
    />
  ),
  userAgreement: (
    <Route
      exact
      path={paths.userAgreement()}
      render={() => (
        <PolicyPage
          pageTitle="User Agreement"
          innerHtml={userAgreementInnerHtml}
        />
      )}
    />
  ),
  codeOfConduct: (
    <Route
      exact
      path={paths.codeOfConduct()}
      render={() => (
        <PolicyPage
          pageTitle="Code of Conduct"
          innerHtml={codeOfConductInnerHtml}
        />
      )}
    />
  ),
  privacyPolicy: (
    <Route
      exact
      path={paths.privacyPolicy()}
      render={() => (
        <PolicyPage
          pageTitle="Privacy Policy"
          innerHtml={privacyPolicyInnerHtml}
        />
      )}
    />
  ),
  cookieNotice: (
    <Route
      exact
      path={paths.cookieNotice()}
      render={() => (
        <PolicyPage
          pageTitle="Cookie Notice"
          innerHtml={cookieNoticeInnerHtml}
        />
      )}
    />
  ),
  faq: (
    <Route
      exact
      path={paths.faq()}
      render={() => (
        <PolicyPage
          pageTitle="Frequently Asked Questions"
          innerHtml={faqInnerHtml}
        />
      )}
    />
  ),

  icons: <Route exact path="/icons" component={IconPage} />,

  testError: <Route exact path="/test-error" component={TestErrorPage} />,
  notFound: <Route component={NotFoundPage} />,
} as const;

const routes = map(routesById, (route: ReactElement, id: string) =>
  React.cloneElement(route, { key: id })
);

export const getPathParam = (
  pathId: keyof typeof routesById,
  paramName: string
) => {
  return getLocationPathParam(pathId, paramName, history.location);
};

export const getLocationPathParam = (
  pathId: keyof typeof routesById,
  paramName: string,
  location: Location<LocationState>
) => {
  const route = routesById[pathId];
  const params = getRouteParams(route, location.pathname);
  if (!params) return null;
  return params[paramName];
};

type PathId = keyof typeof routesById;
type RouteType = typeof routesById[PathId];

const getRouteParams = (route: RouteType, pathname: string) => {
  const { path, exact, strict, sensitive } = route.props;
  const { re, keys } = compilePath(path, exact, strict, sensitive);
  const match = re.exec(pathname);
  if (!match) return null;
  const values = match.slice(1);
  const params = reduce(
    keys,
    function (memo, key, index) {
      memo[key.name] = values[index];
      return memo;
    },
    {} as { [key: string]: string }
  );
  return params;
};

export const isActivePath = (pathId: PathId) => {
  const route = routesById[pathId];
  const { path, exact, strict, sensitive } = route.props;
  const { re } = compilePath(path, exact, strict, sensitive);
  return re.test(history.location.pathname);
};

const patternCache: { [key: string]: Cache } = {};
const cacheLimit = 10000;
let cacheCount = 0;
type CompiledPatternInfo = { re: RegExp; keys: PathToRegexpKey[] };
type Cache = { [key: string]: CompiledPatternInfo };
const compilePath = (
  pattern: string,
  exact: boolean,
  strict: boolean,
  sensitive: boolean
) => {
  const cacheKey = `${exact}${strict}${sensitive}`;
  const cache =
    patternCache[cacheKey] || (patternCache[cacheKey] = {} as Cache);

  if (cache[pattern]) return cache[pattern];

  const keys: PathToRegexpKey[] = [];
  const re = pathToRegexp(pattern, keys, { end: exact, strict, sensitive });
  const compiledPattern = { re, keys };

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern;
    cacheCount++;
  }

  return compiledPattern;
};

export default routes;
