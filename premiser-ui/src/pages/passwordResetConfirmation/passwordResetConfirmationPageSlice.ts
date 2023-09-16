import { ActionCreator, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { all, call, delay, put, race, take, takeEvery } from "typed-redux-saga";

import { ApiErrorCode, PasswordResetConfirmation } from "howdju-common";

import { api, ApiResponseActionMeta } from "@/apiActions";
import config from "@/config";
import { EditorCommitErrorPayload } from "@/types";
import { editors } from "@/actions";

export type ErrorCode =
  | Extract<ApiErrorCode, "ENTITY_NOT_FOUND" | "EXPIRED" | "CONSUMED">
  | "TIMEOUT"
  | "UNKNOWN";

const initialState = {
  email: undefined as string | undefined,
  errorCode: undefined as ErrorCode | undefined,
  isSubmitted: false,
};

export const slice = createSlice({
  name: "passwordResetConfirmationPage",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    checkPasswordResetRequestCode(_state, _action: PayloadAction<string>) {},
    checkPasswordResetRequestCodeSuccess(state, action: PayloadAction<string>) {
      state.email = action.payload;
    },
    checkPasswordResetRequestCodeFailure(
      state,
      action: PayloadAction<ErrorCode>
    ) {
      state.errorCode = action.payload;
    },
    confirmPasswordReset(
      state,
      _action: PayloadAction<PasswordResetConfirmation>
    ) {
      state.isSubmitted = false;
    },
    confirmPasswordResetSuccess(state) {
      state.isSubmitted = true;
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    confirmPasswordResetFailure() {},
  },
});

export default slice.actions;
export const passwordResetConfirmationPage = slice.reducer;

export function* passwordResetConfirmationPageSaga() {
  yield all([checkPasswordResetRequestCodeSaga(), confirmPasswordResetSaga()]);
}

export function* checkPasswordResetRequestCodeSaga() {
  yield takeEvery(
    slice.actions.checkPasswordResetRequestCode,
    // TODO(525) factor out the duplicate logic in these sagas. Use it in factCheckPageSliceSaga too.
    function* ({ payload }) {
      const {
        payload: {
          fetchInit: { requestId },
        },
      } = yield put(api.checkPasswordResetRequest(payload));
      const {
        responseAction,
        timeout,
      }: {
        responseAction: ReturnType<
          typeof api.checkPasswordResetRequest.response
        >;
        timeout: true;
      } = yield race({
        responseAction: call(
          getResponseAction,
          requestId,
          api.checkPasswordResetRequest.response
        ),
        timeout: delay(config.apiTimeoutMs),
      });
      if (responseAction) {
        if (!responseAction.error) {
          yield put(
            slice.actions.checkPasswordResetRequestCodeSuccess(
              responseAction.payload.email
            )
          );
        } else {
          // TODO(#113): remove typecast
          const payload =
            responseAction.payload as unknown as EditorCommitErrorPayload;
          let errorCode = payload.sourceError.body?.errorCode as ErrorCode;
          if (
            !["ENTITY_NOT_FOUND", "EXPIRED", "CONSUMED"].includes(errorCode)
          ) {
            errorCode = "UNKNOWN";
          }
          yield put(
            slice.actions.checkPasswordResetRequestCodeFailure(errorCode)
          );
        }
      } else if (timeout) {
        yield put(
          slice.actions.checkPasswordResetRequestCodeFailure("TIMEOUT")
        );
      } else {
        yield put(
          slice.actions.checkPasswordResetRequestCodeFailure("UNKNOWN")
        );
      }
    }
  );
}

function* getResponseAction<
  T extends PayloadAction<any, string, ApiResponseActionMeta<any, any>>
>(requestId: string, responseActionCreator: ActionCreator<any>) {
  while (true) {
    const resultAction: T = yield take(responseActionCreator);
    if (resultAction.meta.requestId === requestId) {
      return resultAction;
    }
  }
}

export const editorId = "password-reset-confirmation-page-editor";
export const editorType = "PASSWORD_RESET_CONFIRMATION";

export function* confirmPasswordResetSaga() {
  yield takeEvery(editors.commitEdit.result, function* ({ payload }) {
    // See editorCommitEdit.
    if (payload.editorType !== editorType || payload.editorId !== editorId) {
      return;
    }
    if (payload instanceof Error) {
      yield put(slice.actions.confirmPasswordResetFailure());
      return;
    }
    yield put(slice.actions.confirmPasswordResetSuccess());
  });
}
