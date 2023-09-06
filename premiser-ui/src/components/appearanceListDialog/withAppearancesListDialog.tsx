import React from "react";
import FlipMove from "react-flip-move";
import { Button, CircularProgress, DialogContainer } from "react-md";
import { Action } from "redux";

import config from "@/config";
import FlipMoveWrapper from "@/FlipMoveWrapper";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { appearancesSchema } from "@/normalizationSchemas";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import { RootState } from "@/setupStore";
import { combineIds } from "@/viewModels";
import { DialogState } from "./appearancesListDialogSlices";

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
    const { isDialogVisible, appearanceIds, isFetching } =
      useAppSelector(stateSelector);
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
        <FlipMove
          {...config.ui.flipMove}
          className="md-cell md-cell--12 center-text"
        >
          {isFetching && <CircularProgress id={combineIds(id, "progress")} />}
          {!isFetching &&
            appearances.map((appearance) => (
              <FlipMoveWrapper key={appearance.id}>
                <AppearanceCard
                  id={combineIds(id, "appearance", appearance.id)}
                  appearance={appearance}
                />
              </FlipMoveWrapper>
            ))}
          <Button raised primary onClick={() => dispatch(hideDialogAction)}>
            Close
          </Button>
        </FlipMove>
      </DialogContainer>
    );
  };
}
