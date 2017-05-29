import {
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS, LOGOUT_FAILURE,
} from '../actions'

export default (state = {}, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {...state, authToken: action.payload.authToken, email: action.payload.email}
      // remove auth token even if server fails; that way the user is logged out from client and server will eventually cleanup auth token
    case LOGOUT_SUCCESS:
    case LOGOUT_FAILURE:
      return {...state, authToken: null, email: null}
  }

  return state
}