import { ActionCreatorWithPreparedPayload } from "@reduxjs/toolkit";
import { AnyAction } from "redux";

/**
 * A helper for matching any of several action creators.
 *
 * Usage:
 *
 * ```
 * export default createReducer(initialState, builder => {
 *   builder.addMatcher(
 *     matchActions(
 *       api.login.response,
 *       api.confirmRegistration.response,
 *       api.confirmPasswordReset.response,
 *     ),
 *     (state, action) => {
 *       // action.payload type is inferred!
 *       state.authToken = action.payload.authToken
 *     },
 *   )
 * })
 * ```
 */
export function matchActions<
  T1 extends ActionCreatorWithPreparedPayload<any[], any>,
  T2 extends ActionCreatorWithPreparedPayload<any[], any>,
  T3 extends ActionCreatorWithPreparedPayload<any[], any>,
  T4 extends ActionCreatorWithPreparedPayload<any[], any>,
  T5 extends ActionCreatorWithPreparedPayload<any[], any>
>(ac1: T1, ac2: T2, ac3?: T3, ac4?: T4, ac5?: T5) {
  return function actionMatcher(
    action: AnyAction
  ): action is ReturnType<T1> &
    ReturnType<T2> &
    ReturnType<T3> &
    ReturnType<T4> &
    ReturnType<T5> {
    return (
      ac1.match(action) ||
      ac2.match(action) ||
      (ac3 && ac3.match(action)) ||
      (ac4 && ac4.match(action)) ||
      (!!ac5 && ac5.match(action))
    );
  };
}
