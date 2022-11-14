import {handleActions} from "redux-actions"

import {
  ui,
} from '../../actions'

export default handleActions({
  [ui.expand]: (state, action) => {
    const widgetId = action.payload.widgetId
    const widgetState = state[widgetId]
    return {...state, [widgetId]: {...widgetState, isExpanded: true}}
  },
  [ui.collapse]: (state, action) => {
    const widgetId = action.payload.widgetId
    const widgetState = state[widgetId]
    return {...state, [widgetId]: {...widgetState, isExpanded: false}}
  },
}, {})
