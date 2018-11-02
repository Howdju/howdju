import React from 'react'
import reduce from 'lodash/reduce'
import { Route } from 'react-router'
import pathToRegexp from 'path-to-regexp'

import FeaturedPerspectivesPage from './FeaturedPerspectivesPage'
import WhatsNextPage from './WhatsNextPage'
import RecentActivityPage from './RecentActivityPage'
import AboutPage from './AboutPage'
import CreatePropositionPage, {CreatePropositionPageMode} from './CreatePropositionPage'
import LoginPage from './LoginPage'
import PropositionJustificationsPage from './PropositionJustificationsPage'
import TagPage from './TagPage'
import IconPage from './IconPage'
import ToolsPage from './ToolsPage'
import PrivacyPolicyPage from './PrivacyPolicyPage'
import JustificationsSearchPage from './JustificationsSearchPage'
import NotFoundPage from './NotFoundPage'
import MainSearchPage from './MainSearchPage'
import LandingPage from './LandingPage'
import PersorgPage from './PersorgPage'
import paths, {createJustificationPath} from './paths'
import mainSearcher from './mainSearcher'
import {history} from './history'


const renderHomePath = props => {
  const mainSearchText = mainSearcher.mainSearchText(props.location)
  return mainSearchText ?
    <MainSearchPage {...props} /> :
    <LandingPage/>
}

const routes = [
  <Route key="home" exact path={paths.home()} render={renderHomePath}/>,
  <Route key="login" exact path={paths.login()} component={LoginPage} />,

  <Route key="featuredPerspectives" exact path={paths.featuredPerspectives()} component={FeaturedPerspectivesPage} />,
  <Route key="recentActivity" exact path={paths.recentActivity()} component={RecentActivityPage} />,
  <Route key="whatsNext" exact path={paths.whatsNext()} component={WhatsNextPage} />,
  <Route key="about" exact path={paths.about()} component={AboutPage} />,

  <Route key="proposition" exact path="/s/:propositionId/:propositionSlug?" component={PropositionJustificationsPage} />,
  <Route key="persorg" exact path="/persorgs/:persorgId" component={PersorgPage} />,
  <Route key="tag" exact path="/tags/:tagId/:tagSlug?" component={TagPage} />,
  <Route key="searchJustifications" exact path="/search-justifications" component={JustificationsSearchPage} />,

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
  <Route key="privacyPolicy" exact path={paths.privacyPolicy()} component={PrivacyPolicyPage} />,
  <Route key="icons" exact path="/icons" component={IconPage} />,

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
