import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import auth from './auth'
import entities from "./entities";
import editors from "./editors";
import ui from "./ui";
import app from "./app";

export default combineReducers({
  auth,
  app,
  ui,
  entities,
  editors,
  router: routerReducer
})