import {LOCATION_CHANGE} from 'react-router-redux'
import paths from '../paths'
import {handleActions} from "redux-actions"
import {goto} from "../actions"

export default handleActions({
  [LOCATION_CHANGE]: (state, action) => {
    // If the user navigates anywhere other than the login page, clear any login redirection
    if (action.payload.pathname !== paths.login()) {
      return {...state, loginRedirectLocation: null}
    }
    return state
  },
  [goto.login]: (state, action) => ({...state, loginRedirectLocation: action.payload.loginRedirectLocation}),
}, {
  loginRedirectLocation: null
})