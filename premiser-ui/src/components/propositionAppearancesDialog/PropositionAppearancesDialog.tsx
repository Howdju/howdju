import withAppearancesListDialog from "../appearanceListDialog/withAppearancesListDialog";
import propositionAppearancesDialog from "./propositionAppearancesDialogSlice";

const PropositionAppearancesDialog = withAppearancesListDialog(
  "proposition-appearances-dialog",
  "Proposition Appearances",
  (state) => state.propositionAppearancesDialog,
  propositionAppearancesDialog.hideDialog()
);

export default PropositionAppearancesDialog;
