import withAppearancesListDialog from "../appearanceListDialog/withAppearancesListDialog";
import mediaExcerptApparitionsDialog from "./mediaExcerptApparitionsDialogSlice";

const MediaExcerptApparitionsDialog = withAppearancesListDialog(
  "media-excerpt-apparitions-dialog",
  "MediaExcerpt Apparitions",
  (state) => state.mediaExcerptApparitionsDialog,
  mediaExcerptApparitionsDialog.hideDialog()
);

export default MediaExcerptApparitionsDialog;
