import { api } from "@/apiActions";
import {
  createAppearancesDialogListSaga,
  createAppearancesDialogListSlice,
} from "../appearanceListDialog/appearancesListDialogSlices";

const slice = createAppearancesDialogListSlice("mediaExcerptApparitionsDialog");

export default slice.actions;
export const mediaExcerptApparitionsDialog = slice.reducer;

export const mediaExcerptApparitionsDialogSaga =
  createAppearancesDialogListSaga(slice, api.fetchMediaExcerptApparitions);
