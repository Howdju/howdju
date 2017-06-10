import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import auth from './auth'
import entities from "./entities";
import editors from "./editors";
import ui from "./ui";
import app from "./app";
import autocompletes from "./autocompletes";

export default combineReducers({
  app,
  auth,
  autocompletes,
  editors,
  entities,
  router: routerReducer,
  ui,
})