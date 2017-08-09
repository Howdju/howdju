import {
  errors,
} from '../actions'
import { handleActions } from 'redux-actions'

export default handleActions({
  [errors.clearLoggedErrors]: (state, action) => {
    return {...state, loggedErrors: []}
  },
}, { loggedErrors: [] })
