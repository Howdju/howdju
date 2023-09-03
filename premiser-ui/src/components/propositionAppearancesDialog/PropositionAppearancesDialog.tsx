import React from "react";
import { Button, DialogContainer } from "react-md";

import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import propositionAppearanceDialog from "./propositionAppearancesDialogSlice";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import { appearancesSchema } from "@/normalizationSchemas";
import { combineIds } from "@/viewModels";

const id = "proposition-appearances-dialog";

export default function PropositionAppearancesDialog() {
  const { isDialogVisible, appearanceIds } = useAppSelector(
    (state) => state.propositionAppearancesDialog
  );
  const dispatch = useAppDispatch();

  const appearances = useAppEntitySelector(appearanceIds, appearancesSchema);
  return (
    <DialogContainer
      id={id}
      visible={isDialogVisible}
      title="Proposition Appearances"
      onHide={() => dispatch(propositionAppearanceDialog.hideDialog())}
      className="md-overlay--wide-dialog"
    >
      {appearances.map((appearance) => (
        <div key={appearance.id}>
          <AppearanceCard
            id={combineIds(id, "appearance", appearance.id)}
            appearance={appearance}
          />
        </div>
      ))}
      <Button
        raised
        primary
        onClick={() => dispatch(propositionAppearanceDialog.hideDialog())}
      >
        Close
      </Button>
    </DialogContainer>
  );
}
