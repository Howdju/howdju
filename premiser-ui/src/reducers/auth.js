import {
  api,
  app,
} from '../actions'
import { handleActions } from 'redux-actions'

const defaultState = {
  authToken: null,
  authTokenExpiration: null,
  user: null,
}
const authReducer = {
  next: (state, action) => {
    const {
      authToken,
      expires: authTokenExpiration,
      user,
    } = action.payload
    return {...state, authToken, authTokenExpiration, user}
  },
  throw: (state, action) => ({...defaultState})
}
export default handleActions({
  [api.login.response]: authReducer,
  [api.confirmRegistration.response]: authReducer,
  [api.logout.response]: (state, action) => ({...defaultState}),
  [app.clearAuthToken]: (state, action) => ({
    ...state,
    authToken: null,
    authTokenExpiration: null,
  })
}, defaultState)
