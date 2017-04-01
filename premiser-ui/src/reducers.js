import { combineReducers } from 'redux'
import merge from 'lodash/merge'

import { FETCH_STATEMENTS_SUCCESS, FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS, FETCH_STATEMENT_JUSTIFICATIONS_FAILURE} from './actions'

const entities = (state = { statements: {}, justifications: {}, quotes: {} }, action) => {

  switch (action.type) {
    case FETCH_STATEMENTS_SUCCESS:
      return {...state, statements: merge(state.statements, action.payload.entities.statements)}
    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      return {
        ...state,
        statements: merge(state.statements, action.payload.entities.statements),
        justifications: merge(state.justifications, action.payload.entities.justifications),
        quotes: merge(state.quotes, action.payload.entities.quotes),
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