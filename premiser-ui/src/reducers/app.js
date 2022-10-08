import {LOCATION_CHANGE} from 'connected-react-router'
import paths from '../paths'
import {handleActions} from "redux-actions"
import {goto} from "../actions"

export default handleActions({
  [LOCATION_CHANGE]: (state, action) => {
    if (action.payload.location.pathname !== paths.login()) {
      return {...state, loginRedirectLocation: null}
    }
    return state
  },
  [goto.login]: (state, action) => ({...state, loginRedirectLocation: action.payload.loginRedirectLocation}),
}, {
  loginRedirectLocation: null
})
