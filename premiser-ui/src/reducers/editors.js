import {API_RESOURCE_ACTIONS, FAILURE, UPDATE_CITATION_REFERENCE} from "../actions";
import {ENTITY_CONFLICT_RESPONSE_CODE, USER_ACTIONS_CONFLICT_RESPONSE_CODE} from "../responseCodes";
import {combineReducers} from "redux";
import {ERROR} from "../httpStatuses";
import {CITATION_REFERENCE_EDITOR_TYPE} from "../editorTypes";
import {default as t} from '../texts'

const citationReferences = (state = {}, action) => {
  // switch (action.type) {
  //   case API_RESOURCE_ACTIONS[UPDATE_CITATION_REFERENCE][FAILURE]: {
  //     const {
  //       status,
  //       json: {
  //         responseCode,
  //         payload: {
  //           conflictCodes
  //         }
  //       }
  //     } = action.payload
  //     const {
  //       editorType,
  //       editorId,
  //     } = action.meta
  //
  //     const editorState = deepClone(state[editorId])
  //     if (editorType !== CITATION_REFERENCE_EDITOR_TYPE || !editorState) {
  //       break
  //     }
  //
  //     if (status === ERROR) {
  //       switch (responseCode) {
  //         case ENTITY_CONFLICT_RESPONSE_CODE:
  //         case USER_ACTIONS_CONFLICT_RESPONSE_CODE: {
  //           editorState.errorMessage = "Unable to update citation reference"
  //           editorState.errorReasons = conflictCodes.map(c => t(c))
  //         }
  //       }
  //
  //       return {...state, ...{[editorId]: editorState}}
  //     }
  //     break
  //   }
  // }

  return state
}

export default combineReducers({
  citationReferences
})