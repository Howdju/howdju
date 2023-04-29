import { ActionCreatorWithPreparedPayload } from "@reduxjs/toolkit";

export type PayloadOf<AC> = AC extends ActionCreatorWithPreparedPayload<
  any,
  infer P
>
  ? P
  : never;
