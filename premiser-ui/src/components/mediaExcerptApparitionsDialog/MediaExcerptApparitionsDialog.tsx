import React from "react";
import { Button, DialogContainer } from "react-md";

import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import mediaExcerptApparitionsDialog from "./mediaExcerptApparitionsDialogSlice";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import { appearancesSchema } from "@/normalizationSchemas";
import { combineIds } from "@/viewModels";

const id = "proposition-appearances-dialog";

export default function MediaExcerptApparitionsDialog() {
  const { isDialogVisible, appearanceIds } = useAppSelector(
    (state) => state.mediaExcerptApparitionsDialog
  );
  const dispatch = useAppDispatch();

  const appearances = useAppEntitySelector(appearanceIds, appearancesSchema);
  return (
    <DialogContainer
      id={id}
      visible={isDialogVisible}
      title="MediaExcerpt Apparitions"
      onHide={() => dispatch(mediaExcerptApparitionsDialog.hideDialog())}
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
        onClick={() => dispatch(mediaExcerptApparitionsDialog.hideDialog())}
      >
        Close
      </Button>
    </DialogContainer>
  );
}
