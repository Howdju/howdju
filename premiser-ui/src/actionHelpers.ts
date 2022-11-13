// The terminology around redux actions is confusing.
//
// The types `*ActionCreator`: a factory for functions that create actions. Really an ActionCreatorFactory.
// The function `createAction`: a reduxjs/toolkit helper returning an AllTheGoodNamesWereTaken
// There is no word for this concept: `AllTheGoodNamesWereTaken`: a function that returns an Action. Usually you call this inside dispatch.
// `Action`: something passed to redux reducers. Created by AllTheGoodNamesWereTaken.

import {
  ActionFunctionAny,
  combineActions as untypedCombineActions,
} from "redux-actions"
import mapValues from "lodash/mapValues"
import assign from "lodash/assign"
import { isObject } from "lodash"
import {
  ActionCreatorsMapObject,
  ActionCreatorWithoutPayload,
  ActionCreatorWithPreparedPayload,
  createAction as toolkitCreateAction,
  PrepareAction,
} from "@reduxjs/toolkit"
import { Action, bindActionCreators } from "redux"

import {
  actions,
} from "howdju-client-common"

import { AppDispatch } from "./setupStore"

export const str = actions.str

// redux-action's combineActions return value is not recognized as a valid object key.
// So provide this typed version instead.
export const combineActions = untypedCombineActions as (
  ...actionTypes: Array<ActionFunctionAny<Action<string>> | string | symbol>
) => any

/**
 * Helper to bind action creator groups to dispatch for redux-react's connect method.
 *
 * Action groups are what we call the objects below with react-actions action creators.  They are just
 * a way to organize related action creators.  The convention with redux-react's connect method's mapDispatchToProps
 * is to pass an object with keys equal to action creators.  redux-react will automatically turn the action creators
 * into dispatched versions.  This helper accomplishes the same for an object the properties of which are action creator
 * groups like those defined below.
 *
 * @param actionCreatorGroups a map of action creator groups that will be bound by the name of the
 *   action creator group on the returned value.
 * @param otherActions a map of ActionCreators that will be bound to dispatch directly on the
 *   returned value.
 */
export const mapActionCreatorGroupToDispatchToProps =
  <M extends object, N>(actionCreatorGroups: M, otherActions?: N) =>
    (dispatch: AppDispatch): M & N & {dispatch: AppDispatch} => {
      const dispatchingProps = mapValues(
        actionCreatorGroups,
        (actionCreatorGroup: ActionCreatorsMapObject<any>) =>
          bindActionCreators(actionCreatorGroup, dispatch)
      ) as { [P in keyof M]: M[P] } & { [P in keyof N]: N[P] } & {dispatch: AppDispatch}

      if (otherActions) {
        assign(dispatchingProps, bindActionCreators(otherActions, dispatch))
      }
      // Some class-based components require dispatch to pass it to action-dispatching callback factories.
      dispatchingProps.dispatch = dispatch

      return dispatchingProps
    }

/**
 * Helper to create a reduxjs/toolkit prepare method that is compatible with redux-actions syle calls.
 *
 * redux-actions's `handleActions` helper accepts separate `next` and `throw` reducers. It will call
 * the `throw` reducer if the action's `error` field `=== true`.
 * (https://github.com/redux-utilities/redux-actions/blob/4bd68b11b841718e64999d214544d6a87337644e/src/handleAction.js#L33)
 *
 * If an action creator is called with an error object, it is set as the payload and the payload
 * creator method (i.e. our `prepare`) will not be called.
 * See https://redux-actions.js.org/api/createaction#createactiontype-payloadcreator
 */
function reduxActionsCompatiblePrepare<P>(
  prepare: PrepareAction<P>
): PrepareAction<P | Error> {
  return function (...args: any[]) {
    if (args.length > 0 && args[0] instanceof Error) {
      return {
        // Pass the error as the payload, to be compatible with redux-actions createAction
        payload: args[0],
        error: true,
      }
    }
    const prepared = prepare(...args)
    return prepared
  }
}

/**
 * A createAction that translates our calling convention to the reduxjs/toolkit convention.
 *
 * The reduxjs/toolkit calling convention is to pass a single `prepare` method that must return an
 * object like `{payload, meta?, error?}`.
 *
 * Since our app uses the convention of invoking action creators with multiple positional arguments
 * that are translated into a payload, reduxjs./toolkit's convention would add a lot of verbose
 * boilerplate like:
 *
 * ```
 * createAction('THE_ACTION_TYPE', (arg1, arg2) => ({payload: {arg1, arg2}}))
 * ```
 *
 * as opposed to:
 *
 * ```
 * createAction('THE_ACTION_TYPE', (arg1, arg2) => ({arg1, arg2}))
 * ```
 *
 * (where we can omit the `payload` field.)
 *
 * To avoid the boilerplate, we adopt a createAction callling convention accepting a
 * payloadCreatorOrPrepare function. If this function returns an object containing a `payload`
 * field, then the return value is used directly as the prepared value. Otherwise, the return value
 * is used as the `payload` of a new prepared object.
 *
 * One consequence of this is that, in the unlikely event that the payload should contain a field
 * called payload, then the payloadCreatorOrPrepare function should return a fully prepared object like:
 *
 * ```json
 * {payload: {payload: {...}}}
 * ```
 */
export function createAction<T extends string>(type: T): ActionCreatorWithoutPayload<T>
export function createAction<T extends string, P, Args extends any[]>(
  type: T,
  payloadCreatorOrPrepare: (...args: Args) => {payload: P, meta?: any} | P,
): ActionCreatorWithPreparedPayload<Args, P, T>
export function createAction<T extends string, P>(
  type: T,
  payloadCreatorOrPrepare?: (...args: any[]) => {payload: P, meta?: any} | P,
) {
  const prepare = payloadCreatorOrPrepare && function prepare(...args: any[]) {
    let prepared = payloadCreatorOrPrepare(...args)
    if (!isObject(prepared) || !('payload' in prepared)) {
      prepared = {payload: prepared}
    }
    return prepared
  }
  if (prepare) {
    return toolkitCreateAction(type, reduxActionsCompatiblePrepare(prepare))
  }
  return toolkitCreateAction(type)
}

export const actionTypeDelim = "/"
