import {
  api,
} from '../actions'
import { handleActions } from 'redux-actions'

const defaultState = { authToken: null, user: null }
export default handleActions({
  [api.login.response]: {
    next: (state, action) => {
      const {
        authToken,
        user,
      } = action.payload
      return {...state, authToken, user}
    },
    throw: (state, action) => ({...defaultState})
  },
  [api.logout.response]: (state, action) => ({...defaultState})
}, defaultState)
