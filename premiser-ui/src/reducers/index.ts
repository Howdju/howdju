import { combineReducers } from '@reduxjs/toolkit'
import { connectRouter } from 'connected-react-router'
import { History } from 'history'
import mapValues from 'lodash/mapValues'

import {app} from "../app/appSlice"
import auth from './auth'
import autocompletes from "./autocompletes"
import editors from "./editors"
import entities from "./entities"
import errors from './errors'
import privacyConsent from "./privacyConsent"
import ui from "./ui"
import widgets from './widgets'
import * as sagaSlices from '../sagaSlices'
import {mainSearch} from "../components/mainSearchBox/mainSearchBoxSlice"
import {mainSearchPage} from "../pages/mainSearch/mainSearchPageSlice"
import { justificationsSearchPage } from '@/pages/justificationsSearch/justificationsSearchPageSlice'
import {tagPage} from "@/pages/tag/tagPageSlice"
import {persorgPage} from "@/pages/persorg/persorgPageSlice"

export default (history: History) => combineReducers({
  app,
  auth,
  autocompletes,
  editors,
  entities,
  errors,
  justificationsSearchPage,
  mainSearch,
  mainSearchPage,
  persorgPage,
  privacyConsent,
  router: connectRouter(history),
  tagPage,
  ui,
  widgets,
  ...mapValues(sagaSlices, s => s.reducer)
})
