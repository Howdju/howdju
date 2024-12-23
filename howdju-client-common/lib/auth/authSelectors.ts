import { AuthState } from "./authReducer";

type HasAuthState = {
  auth: AuthState;
};

export const selectAuthToken = <TRootState extends HasAuthState>(
  state: TRootState
) => state.auth.authToken;
