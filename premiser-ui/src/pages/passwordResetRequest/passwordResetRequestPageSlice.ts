import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { put, takeEvery } from "typed-redux-saga";

import { ApiErrorCode, DurationDisplayInfo } from "howdju-common";

import { EditorCommitErrorPayload } from "@/types";
import { editors } from "@/actions";

export type ErrorCode =
  | Extract<ApiErrorCode, "ENTITY_NOT_FOUND">
  | "TIMEOUT"
  | "UNKNOWN";

const initialState = {
  duration: undefined as DurationDisplayInfo | undefined,
  errorCode: undefined as string | undefined,
};

export const slice = createSlice({
  name: "passwordResetRequestPage",
  initialState,
  reducers: {
    reset(state) {
      state.duration = undefined;
    },
    requestPasswordReset(state, _action: PayloadAction<{ email: string }>) {
      state.duration = undefined;
      state.errorCode = undefined;
    },
    requestPasswordResetSuccess(
      state,
      action: PayloadAction<DurationDisplayInfo>
    ) {
      state.duration = action.payload;
    },
    requestPasswordResetFailure(state, action: PayloadAction<ErrorCode>) {
      state.errorCode = action.payload;
    },
  },
});

export default slice.actions;
export const passwordResetRequestPage = slice.reducer;

export const editorType = "PASSWORD_RESET_REQUEST";
export const editorId = "password-reset-request-editor";

export function* passwordResetRequestPageSaga() {
  yield takeEvery(editors.commitEdit.result, function* ({ payload }) {
    // See editorCommitEdit.
    if (payload.editorType !== editorType || payload.editorId !== editorId) {
      return;
    }
    if (payload instanceof Error) {
      // TODO(113): remove typecast
      const errorPayload = payload as unknown as EditorCommitErrorPayload;
      let errorCode = errorPayload.sourceError.body?.errorCode as ErrorCode;
      if (!["ENTITY_NOT_FOUND"].includes(errorCode)) {
        errorCode = "UNKNOWN";
      }
      yield put(slice.actions.requestPasswordResetFailure(errorCode));
      return;
    }
    yield put(
      slice.actions.requestPasswordResetSuccess(payload.result.duration)
    );
  });
}
