import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import {LOCATION_CHANGE} from 'react-router-redux'
import paths from '../paths'

import {
  LOGIN_REDIRECT,
  FETCH_STATEMENT_SUGGESTIONS_SUCCESS,
} from '../actions'
import auth from './auth'
import entities from "./entities";
import editors from "./editors";
import ui from "./ui";


const app = (state = { loginRedirectLocation: null, statementSuggestions: {} }, action) => {
  switch (action.type) {
    case LOGIN_REDIRECT:
      // When we redirect to the login page, store the previous location
      return {...state, loginRedirectLocation: action.payload.routerLocation}
    case LOCATION_CHANGE:
      // If the user navigates anywhere other than the login page, clear any login redirection
      if (action.payload.pathname !== paths.login()) {
        return {...state, loginRedirectLocation: null}
      }
      break;
    case FETCH_STATEMENT_SUGGESTIONS_SUCCESS:
      return {
        ...state,
        statementSuggestions: {
          ...state.statementSuggestions,
          ...{ [action.meta.suggestionsKey]: action.payload.result}
        }
      }
  }

  return state
}

export default combineReducers({
  auth,
  app,
  ui,
  entities,
  editors,
  router: routerReducer
})