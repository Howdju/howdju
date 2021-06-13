import React from 'react'
import reduce from 'lodash/reduce'
import { Route } from 'react-router'
import { pathToRegexp } from 'path-to-regexp'

import {
  JustificationRootTargetType,
  commonPaths,
} from 'howdju-common'

import AboutPage from './AboutPage'
import CreatePropositionPage, {CreatePropositionPageMode} from './CreatePropositionPage'
import FeaturedPerspectivesPage from './FeaturedPerspectivesPage'
import {history} from './history'
import IconPage from './IconPage'
import JustificationsPage from './JustificationsPage'
import JustificationsSearchPage from './JustificationsSearchPage'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import mainSearcher from './mainSearcher'
import MainSearchPage from './MainSearchPage'
import NotFoundPage from './NotFoundPage'
import PasswordResetRequestPage from './PasswordResetRequestPage'
import PasswordResetConfirmationPage from './PasswordResetConfirmationPage'
import paths, {createJustificationPath} from './paths'
import PersorgPage from './PersorgPage'
import PrivacySettingsPage from "./PrivacySettingsPage"
import PoliciesOverviewPage from './policies/PoliciesOverviewPage'
import PropositionUsagesPage from './PropositionUsagesPage'
import RecentActivityPage from './RecentActivityPage'
import RegistrationConfirmationPage from './RegistrationConfirmationPage'
import RegistrationRequestPage from './RegistrationRequestPage'
import TagPage from './TagPage'
import TestErrorPage from './TestErrorPage'
import ToolsPage from './ToolsPage'
import WhatsNextPage from './WhatsNextPage'
import PolicyPage from "./policies/PolicyPage"

import principlesInnerHtml from './policies/principles.md'
import userAgreementInnerHtml from './policies/user-agreement.md'
import codeOfConductInnerHtml from './policies/code-of-conduct.md'
import privacyPolicyInnerHtml from './policies/privacy-policy.md'
import cookieNoticeInnerHtml from './policies/cookie-notice.md'
import faqInnerHtml from './policies/faq.md'

const renderHomePath = props => {
  const mainSearchText = mainSearcher.mainSearchText(props.location)
  return mainSearchText ?
    <MainSearchPage {...props} /> :
    <LandingPage/>
}

const routes = [
  <Route key="home" exact path={paths.home()} render={renderHomePath}/>,
  <Route key="login" exact path={paths.login()} component={LoginPage} />,
  <Route key="request-registration" exact path={paths.requestRegistration()} component={RegistrationRequestPage} />,
  <Route key="confirm-registration" exact path={commonPaths.confirmRegistration()} component={RegistrationConfirmationPage} />,
  <Route key="request-password-reset" exact path={paths.requestPasswordReset()} component={PasswordResetRequestPage} />,
  <Route key="confirm-password-reset" exact path={commonPaths.confirmPasswordReset()} component={PasswordResetConfirmationPage} />,

  <Route key="featuredPerspectives" exact path={paths.featuredPerspectives()} component={FeaturedPerspectivesPage} />,
  <Route key="recentActivity" exact path={paths.recentActivity()} component={RecentActivityPage} />,
  <Route key="whatsNext" exact path={paths.whatsNext()} component={WhatsNextPage} />,
  <Route key="about" exact path={paths.about()} component={AboutPage} />,

  <Route key="proposition" exact path="/p/:rootTargetId/:slug?" render={props => (
    <JustificationsPage {...props} rootTargetType={JustificationRootTargetType.PROPOSITION} />
  )} />,
  <Route key="statement" exact path="/s/:rootTargetId/:slug?" render={props => (
    <JustificationsPage {...props} rootTargetType={JustificationRootTargetType.STATEMENT} />
  )} />,
  <Route key="persorg" exact path="/persorgs/:persorgId/:slug?" component={PersorgPage} />,
  <Route key="tag" exact path="/tags/:tagId/:tagSlug?" component={TagPage} />,
  <Route key="searchJustifications" exact path="/search-justifications" component={JustificationsSearchPage} />,
  <Route key="proposition-usages" exact path="/proposition-usages" component={PropositionUsagesPage} />,

  <Route key="createProposition" exact path="/create-proposition" render={props => (
    <CreatePropositionPage {...props} mode={CreatePropositionPageMode.CREATE_PROPOSITION} />
  )} />,
  <Route key="createJustification" exact path={createJustificationPath} render={props => (
    <CreatePropositionPage {...props} mode={CreatePropositionPageMode.CREATE_JUSTIFICATION} />
  )} />,
  <Route key="submit" exact path="/submit" render={props => (
    <CreatePropositionPage {...props} mode={CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING} />
  )} />,

  <Route key="tools" exact path="/tools" component={ToolsPage} />,
  <Route key="privacySettings" exact path="/settings/privacy" component={PrivacySettingsPage} />,

  <Route key="policiesOverview" exact path={paths.policiesOverview()} component={PoliciesOverviewPage} />,
  <Route key="values" exact path={paths.principles()} render={() => (
    <PolicyPage pageTitle="Principles" innerHtml={principlesInnerHtml} />
  )} />,
  <Route key="userAgreement" exact path={paths.userAgreement()} render={() => (
    <PolicyPage pageTitle="User Agreement" innerHtml={userAgreementInnerHtml} />
  )} />,
  <Route key="codeOfConduct" exact path={paths.codeOfConduct()} render={() => (
    <PolicyPage pageTitle="Code of Conduct" innerHtml={codeOfConductInnerHtml} />
  )} />,
  <Route key="privacyPolicy" exact path={paths.privacyPolicy()} render={() => (
    <PolicyPage pageTitle="Privacy Policy" innerHtml={privacyPolicyInnerHtml} />
  )} />,
  <Route key="cookieNotice" exact path={paths.cookieNotice()} render={() => (
    <PolicyPage pageTitle="Cookie Notice" innerHtml={cookieNoticeInnerHtml} />
  )} />,
  <Route key="faq" exact path={paths.faq()} render={() => (
    <PolicyPage pageTitle="Frequently Asked Questions" innerHtml={faqInnerHtml} />
  )} />,

  <Route key="icons" exact path="/icons" component={IconPage} />,

  <Route key="testError" exact path="/test-error" component={TestErrorPage} />,
  <Route key="notFound" component={NotFoundPage} />,
]

export const routeIds = reduce(routes, (result, route) => {
  result[route.key] = route.key
  return result
}, {})

export const routesById = reduce(routes, (result, route) => {
  result[route.key] = route
  return result
}, {})

export const getPathParam = (pathId, paramName) => {
  const route = routesById[pathId]
  const params = getRouteParams(route, history.location.pathname)
  if (!params) return null
  return params[paramName]
}

const getRouteParams = (route, pathname) => {
  const {path, exact, strict, sensitive} = route.props
  const {re, keys} = compilePath(path, exact, strict, sensitive)
  const match = re.exec(pathname)
  if (!match) return null
  const values = match.slice(1)
  const params = reduce(keys, function (memo, key, index) {
    memo[key.name] = values[index]
    return memo
  }, {})
  return params
}

export const isActivePath = (pathId) => {
  const route = routesById[pathId]
  const {path, exact, strict, sensitive} = route.props
  const {re} = compilePath(path, exact, strict, sensitive)
  return re.test(history.location.pathname)
}

const patternCache = {}
const cacheLimit = 10000
let cacheCount = 0
const compilePath = (pattern, exact, strict, sensitive) => {
  const cacheKey = '' + exact + strict + sensitive
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {})

  if (cache[pattern]) return cache[pattern]

  const keys = []
  const re = pathToRegexp(pattern, keys, {end: exact, strict, sensitive})
  const compiledPattern = { re: re, keys: keys }

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern
    cacheCount++
  }

  return compiledPattern
}

export default routes
