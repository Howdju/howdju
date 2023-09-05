import { api } from "@/apiActions";
import {
  createAppearancesDialogListSaga,
  createAppearancesDialogListSlice,
} from "../appearanceListDialog/appearancesListDialogSlices";

const slice = createAppearancesDialogListSlice("PropositionAppearancesDialog");

export default slice.actions;
export const mediaExcerptApparitionsDialog = slice.reducer;

export const mediaExcerptApparitionsDialogSaga =
  createAppearancesDialogListSaga(slice, api.fetchPropositionAppearances);
