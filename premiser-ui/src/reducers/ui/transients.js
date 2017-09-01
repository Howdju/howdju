import {handleActions} from "redux-actions"
import set from 'lodash/set'

import {
  ui
} from '../../actions'


export default handleActions({
  [ui.showTransient]: (state, action) => {
    const newState = {...state}
    const transientId = action.payload.transientId

    set(newState, [transientId, 'isVisible'], true)

    return newState
  },
  [ui.hideTransient]: (state, action) => {
    const newState = {...state}
    const transientId = action.payload.transientId

    set(newState, [transientId, 'isVisible'], false)

    return newState
  }
}, {})