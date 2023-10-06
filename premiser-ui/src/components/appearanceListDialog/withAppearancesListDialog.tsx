import React from "react";
import FlipMove from "react-flip-move";
import { Action } from "redux";
import { Button } from "@react-md/button";
import { CircularProgress } from "@react-md/progress";

import config from "@/config";
import FlipMoveWrapper from "@/FlipMoveWrapper";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { appearancesSchema } from "@/normalizationSchemas";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import { RootState } from "@/setupStore";
import { combineIds } from "@/viewModels";
import { DialogState } from "./appearancesListDialogSlices";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/dialog/Dialog";

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
      <Dialog
        id={id}
        visible={isDialogVisible}
        title={title}
        onRequestClose={() => dispatch(hideDialogAction)}
        aria-labelledby={combineIds(id, "dialog-title")}
      >
        <DialogContent>
          <FlipMove {...config.ui.flipMove} className="center-text">
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
          </FlipMove>
        </DialogContent>
        <DialogFooter>
          <Button
            themeType="contained"
            theme="primary"
            onClick={() => dispatch(hideDialogAction)}
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    );
  };
}
