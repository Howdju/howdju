import {
  api,
} from '../actions'
import { handleActions } from 'redux-actions'

export default handleActions({
  [api.login.response]: (state, action) => {
    const {
      authToken,
      email
    } = action.payload
    return {...state, authToken, email}
    },
  [api.logout.response]: (state, action) => ({...state, authToken: null, email: null})
}, { authToken: null, email: null })
