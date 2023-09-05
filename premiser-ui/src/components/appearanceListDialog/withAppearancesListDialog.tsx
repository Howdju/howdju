import React from "react";
import { Action } from "redux";
import { Button, DialogContainer } from "react-md";

import { EntityId } from "howdju-common";

import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { appearancesSchema } from "@/normalizationSchemas";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import { RootState } from "@/setupStore";
import { combineIds } from "@/viewModels";

type DialogState = { isDialogVisible: boolean; appearanceIds: EntityId[] };

export default function withAppearancesListDialog(
  /** The HTML id of the dialog. */
  id: string,
  /** The title of the dialog. */
  title: string,
  /** A selector for the dialog's state. */
  stateSelector: (state: RootState) => DialogState,
  /** An action to hide the dialog. */
  hideDialogAction: Action
) {
  return function AppearancesListDialog() {
    const { isDialogVisible, appearanceIds } = useAppSelector(stateSelector);
    const dispatch = useAppDispatch();

    const appearances = useAppEntitySelector(appearanceIds, appearancesSchema);
    return (
      <DialogContainer
        id={id}
        visible={isDialogVisible}
        title={title}
        onHide={() => dispatch(hideDialogAction)}
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
        <Button raised primary onClick={() => dispatch(hideDialogAction)}>
          Close
        </Button>
      </DialogContainer>
    );
  };
}
