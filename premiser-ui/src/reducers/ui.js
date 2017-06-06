import { combineReducers } from 'redux'
import merge from 'lodash/merge'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import {LOCATION_CHANGE} from 'react-router-redux'
import {handleActions} from "redux-actions";

import {
  isCounter,
  makeNewCounterJustification,
} from '../models'
import paths from '../paths'

import {
  api,
  ui
} from '../actions'
import text, {CREATE_JUSTIFICATION_FAILURE_MESSAGE} from "../texts";
import mainSearcher from '../mainSearcher'


const loginErrorMessage = (status) => {
  switch (status) {
    case 400:
      return 'Invalid credentials'
    case 403:
      return 'Incorrect password'
    case 404:
      return 'Email does not exist'
    default:
      return 'Unable to complete login at this time'
  }
}

const loginPage = handleActions({
  [api.login]: (state, action) => ({...state, isLoggingIn: true}),
  [api.login.response]: {
    next: state => ({...state, isLoggingIn: false}),
    throw: (state, action) => ({...state, isLoggingIn: false})
  },
}, {
  isLoggingIn: false,
})

const statementJustificationsPage = handleActions({
  [api.fetchStatementJustifications]: (state, action) => ({...state, isFetching: true, didFail: false}),
  [api.fetchStatementJustifications.response]: {
    next: (state, action) => ({...state, isFetching: false}),
    throw: (state, action) => ({...state, isFetching: false, didFail: true}),
  },
  [ui.showNewJustificationDialog]: (state, action) => ({
    ...state,
    isNewJustificationDialogVisible: true,
  }),
  [ui.hideNewJustificationDialog]: (state, action) => ({...state, isNewJustificationDialogVisible: false}),
  [api.createJustification]: (state, action) => {
    const justification = action.payload.justification

    // If it's a counter-justification, update the creating state
    let newCounterJustificationIsCreatingByTargetId = state.newCounterJustificationIsCreatingByTargetId
    if (isCounter(justification)) {
      const targetJustificationId = justification.target.entity.id
      newCounterJustificationIsCreatingByTargetId = merge(newCounterJustificationIsCreatingByTargetId, {
        [targetJustificationId]: true
      })
    }
    return {
      ...state,
      newCounterJustificationIsCreatingByTargetId,
    }
  },
  [api.createJustification.response]: {
    next: (state, action) => {
      const justification = action.payload.entities.justifications[action.payload.result.justification]

      // If we just created a counter justification, ensure that it is no longer editing
      let newCounterJustificationsByTargetId = state.newCounterJustificationsByTargetId
      if (isCounter(justification)) {
        const targetJustificationId = justification.target.entity.id
        newCounterJustificationsByTargetId = merge(state.newCounterJustificationsByTargetId, {
          [targetJustificationId]: null
        })
      }
      return {
        ...state,
        newCounterJustificationsByTargetId,
      }
    },
    throw: (state, action) => ({...state, newJustificationErrorMessage: text(CREATE_JUSTIFICATION_FAILURE_MESSAGE)})
  },
  [ui.addNewCounterJustification]: (state, action) => {
    const targetJustification = action.payload.targetJustification
    const newCounterJustification = makeNewCounterJustification(targetJustification)
    return {
      ...state,
      newCounterJustificationsByTargetId: merge(state.newCounterJustificationsByTargetId, {
        [targetJustification.id]: newCounterJustification
      }),
    }
  },
  [ui.newCounterJustificationPropertyChange]: (state, action) => {
    const {justification, properties} = action.payload
    const targetJustificationId = justification.target.entity.id
    const newCounterJustification = cloneDeep(state.newCounterJustificationsByTargetId[targetJustificationId])
    forEach(properties, (val, key) => {
      set(newCounterJustification, key, val)
    })
    return {
      ...state,
      newCounterJustificationsByTargetId: merge(state.newCounterJustificationsByTargetId, {
        [targetJustificationId]: newCounterJustification
      }),
    }
  },
  [ui.cancelNewCounterJustification]: (state, action) => {
    const justification = action.payload.justification
    const targetJustificationId = justification.target.entity.id
    return {
      ...state,
      newCounterJustificationsByTargetId: merge(state.newCounterJustificationsByTargetId, {
        [targetJustificationId]: null
      }),
    }
  },
}, {
  isFetching: false,
  didFail: false,
  isNewJustificationDialogVisible: false,
  // i.e. newRootJustification
  newJustification: null,
  newJustificationErrorMessage: '',
  newCounterJustificationsByTargetId: {},
  newCounterJustificationIsCreatingByTargetId: {},
})

export const appUi = handleActions({
  [ui.showNavDrawer]: (state, action) => ({...state, isNavDrawerVisible: true}),
  [ui.hideNavDrawer]: (state, action) => ({...state, isNavDrawerVisible: false}),
  [ui.toggleNavDrawerVisibility]: (state, action) => ({...state, isNavDrawerVisible: !state.isNavDrawerVisible}),
  [ui.setNavDrawerVisibility]: (state, action) => ({...state, isNavDrawerVisible: action.payload.visible}),
  [ui.addToast]: (state, action) => ({...state, toasts: state.toasts.concat(action.payload)}),
  [ui.dismissToast]: (state, action) => ({...state, toasts: state.toasts.slice(1)}),
}, {
  isNavDrawerVisible: false,
  toasts: []
})

export const mainSearch = handleActions({
  [ui.mainSearchTextChange]: (state, action) => ({...state, mainSearchText: action.payload}),
  [LOCATION_CHANGE]: (state, action) => {
    if (!mainSearcher.isSearch(action.payload)) {
      return {...state, mainSearchText: ''}
    }
    return state
  },
  [api.fetchMainSearchAutocomplete.response]: {
    next: (state, action) => {
      const autocompleteResults = action.payload.result.map(id => action.payload.entities.statements[id])
      return {...state, autocompleteResults}
    }
  },
  [ui.clearMainSearchAutocomplete]: (state, action) => ({...state, autocompleteResults: []})
}, {
  mainSearchText: '',
  autocompleteResults: []
})

export const mainSearchPage = handleActions({
  [api.fetchStatementsSearch]: (state, action) => ({...state, isFetching: true}),
  [api.fetchStatementsSearch.response]: {
    next: (state, action) => {
      const statements = action.payload.result.map(id => action.payload.entities.statements[id])
      return {...state, isFetching: false, statements: statements || []}
    },
    throw: (state, action) => ({...state, isFetching: false})
  }
}, {
  isFetching: false,
  statements: []
})

const editStatementJustificationPage = handleActions({
  [ui.setDoCreateJustification]: (state, action) => ({...state, doCreateJustification: action.payload.doCreateJustification})
}, {
  doCreateJustification: false,
})

export default combineReducers({
  loginPage,
  statementJustificationsPage,
  mainSearchPage,
  app: appUi,
  mainSearch,
  editStatementJustificationPage,
})