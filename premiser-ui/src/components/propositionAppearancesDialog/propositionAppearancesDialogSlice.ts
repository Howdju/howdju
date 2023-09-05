import { api } from "@/apiActions";
import {
  createAppearancesDialogListSaga,
  createAppearancesDialogListSlice,
} from "../appearanceListDialog/appearancesListDialogSlices";

const slice = createAppearancesDialogListSlice("PropositionAppearancesDialog");

export default slice.actions;
export const propositionAppearancesDialog = slice.reducer;

export const propositionAppearancesDialogSaga = createAppearancesDialogListSaga(
  slice,
  api.fetchPropositionAppearances
);
