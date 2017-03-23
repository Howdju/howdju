import { combineReducers } from 'redux'
import _ from 'lodash'

import { FETCH_STATEMENTS_SUCCESS, FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS, FETCH_STATEMENT_JUSTIFICATIONS_FAILURE} from './actions'

const entities = (state = { statements: {}, justifications: {}, quotes: {} }, action) => {

  switch (action.type) {
    case FETCH_STATEMENTS_SUCCESS:
      return {...state, statements: _.merge(state.statements, action.payload.entities.statements)}
    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      return {
        ...state,
        statements: _.merge(state.statements, action.payload.entities.statements),
        justifications: _.merge(state.justifications, action.payload.entities.justifications),
        quotes: _.merge(state.quotes, action.payload.entities.quotes),
      }
  }

  return state
}

const ui = (state = {}, action) => {
  switch (action.type) {
    case FETCH_STATEMENT_JUSTIFICATIONS_FAILURE:
      console.error(action.payload);
      return {...state, errorMessage: 'Failed to load justifications'}
  }

  return state;
}

export default combineReducers({
  ui,
  entities,
})