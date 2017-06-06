import {LOCATION_CHANGE} from 'react-router-redux'
import paths from '../paths'
import {handleActions} from "redux-actions";
import {api, goto} from "../actions";

export default handleActions({
  [LOCATION_CHANGE]: (state, action) => {
    // If the user navigates anywhere other than the login page, clear any login redirection
    if (action.payload.pathname !== paths.login()) {
      return {...state, loginRedirectLocation: null}
    }
    return state
  },
  [goto.login]: (state, action) => ({...state, loginRedirectLocation: action.payload.loginRedirectLocation}),
  [api.fetchStatementSuggestions.response]: {
    next: (state, action) => ({
      ...state,
      statementSuggestions: {
        ...state.statementSuggestions,
        [action.meta.requestPayload.suggestionsKey]: action.payload.result,
      }
    })
  }
}, {
  loginRedirectLocation: null,
  statementSuggestions: {}
})