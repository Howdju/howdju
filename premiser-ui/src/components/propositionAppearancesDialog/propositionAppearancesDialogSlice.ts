import { api } from "howdju-client-common";

import {
  createAppearancesDialogListSaga,
  createAppearancesDialogListSlice,
} from "../appearanceListDialog/appearancesListDialogSlices";

const slice = createAppearancesDialogListSlice("propositionAppearancesDialog");

export default slice.actions;
export const propositionAppearancesDialog = slice.reducer;

export const propositionAppearancesDialogSaga = createAppearancesDialogListSaga(
  slice,
  api.fetchPropositionAppearances
);
