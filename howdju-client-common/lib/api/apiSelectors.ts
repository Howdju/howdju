import { RootState } from "./setupStore";

export const selectAuthToken = (state: RootState) => state.auth.authToken;
