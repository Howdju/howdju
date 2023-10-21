import React, { ReactEventHandler } from "react";
import FlipMove from "react-flip-move";
import get from "lodash/get";
import groupBy from "lodash/groupBy";
import map from "lodash/map";
import { Grid, GridCell } from "@react-md/utils";

import {
  ContextTrailItem,
  JustificationPolarities,
  JustificationView,
} from "howdju-common";

import config from "./config";
import JustificationBranch from "./JustificationBranch";
import t, { ADD_JUSTIFICATION_CALL_TO_ACTION } from "./texts";
import { combineIds, extendContextTrailItems } from "./viewModels";
import { ComponentId, OnClickJustificationWritQuoteUrl } from "./types";
import { useAppSelector } from "./hooks";
import { selectIsWindowNarrow } from "./selectors";
import FlipMoveWrapper from "./FlipMoveWrapper";
import TextButton from "./components/button/TextButton";

interface Props {
  id: ComponentId;
  className?: string;
  justifications: JustificationView[];
  doShowControls: boolean;
  doShowJustifications: boolean;
  /** Whether to combine justifications into a single column */
  isCondensed?: boolean;
  /** Whether to have two columns for justifications even when one will be empty. */
  isUnCondensed?: boolean;
  showBasisUrls: boolean;
  contextTrailItems: ContextTrailItem[];
  onClickWritQuoteUrl: OnClickJustificationWritQuoteUrl;
  showNewPositiveJustificationDialog: ReactEventHandler;
  showNewNegativeJustificationDialog: ReactEventHandler;
}

export default function JustificationsTree({
  id,
  doShowControls = false,
  doShowJustifications = false,
  showBasisUrls,
  contextTrailItems,
  onClickWritQuoteUrl,
  justifications,
  isCondensed = false,
  isUnCondensed = false,
  showNewPositiveJustificationDialog,
  showNewNegativeJustificationDialog,
}: Props) {
  function toBranch(j: JustificationView) {
    const treeId = combineIds(id, "justification-tree", j.id);
    const nextContextTrailItems = extendContextTrailItems(contextTrailItems, {
      connectingEntityType: "JUSTIFICATION",
      connectingEntity: j,
    });
    return (
      <FlipMoveWrapper key={treeId}>
        <JustificationBranch
          justification={j}
          doShowControls={doShowControls}
          doShowBasisJustifications={doShowJustifications}
          isCondensed={isCondensed}
          isUnCondensed={isUnCondensed}
          showBasisUrls={showBasisUrls}
          showStatusText={true}
          contextTrailItems={nextContextTrailItems}
          onClickWritQuoteUrl={onClickWritQuoteUrl}
        />
      </FlipMoveWrapper>
    );
  }

  const justificationsByPolarity = groupBy(justifications, (j) => j.polarity);
  const positiveJustifications = get(
    justificationsByPolarity,
    JustificationPolarities.POSITIVE,
    []
  );
  const negativeJustifications = get(
    justificationsByPolarity,
    JustificationPolarities.NEGATIVE,
    []
  );
  const hasPositiveJustifications = positiveJustifications.length > 0;
  const hasNegativeJustifications = negativeJustifications.length > 0;
  const hasBothSides = hasPositiveJustifications && hasNegativeJustifications;
  const hasJustifications =
    positiveJustifications.length > 0 || negativeJustifications.length > 0;

  const isWindowNarrow = useAppSelector(selectIsWindowNarrow);

  // The branches will take up half of the cells on large screens. On smaller screens
  // the isWindowNarrow condition below should apply to combine them into a single column.
  const justificationBranchColSpans = {
    largeDesktop: { colSpan: 6 },
    desktop: { colSpan: 6 },
    tablet: { colSpan: 8 },
    phone: { colSpan: 4 },
  };

  let branchesCells = null;
  if (isWindowNarrow || isCondensed || (!hasBothSides && !isUnCondensed)) {
    branchesCells = (
      <GridCell clone={true} colSpan={12}>
        <FlipMove
          {...config.ui.flipMove}
          className="proposition-justifications-justification-trees--combined"
        >
          {hasJustifications && (
            <h2 key="justifications-header">Justifications</h2>
          )}
          {map(justifications, toBranch)}
        </FlipMove>
      </GridCell>
    );
  } else {
    const positiveTreeClass =
      "proposition-justifications-justification-trees--positive";
    const negativeTreeClass =
      "proposition-justifications-justification-trees--negative";
    branchesCells = [
      <GridCell
        clone={true}
        key={positiveTreeClass}
        {...justificationBranchColSpans}
      >
        <FlipMove {...config.ui.flipMove} className={positiveTreeClass}>
          {hasJustifications && <h2>Supporting Justifications</h2>}
          {hasJustifications && !hasPositiveJustifications && (
            <div style={{ textAlign: "center" }}>
              <div>None</div>
              <TextButton onClick={showNewPositiveJustificationDialog}>
                {t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
              </TextButton>
            </div>
          )}
          {map(positiveJustifications, toBranch)}
        </FlipMove>
      </GridCell>,
      <GridCell
        clone={true}
        key={negativeTreeClass}
        {...justificationBranchColSpans}
      >
        <FlipMove {...config.ui.flipMove} className={negativeTreeClass}>
          {hasJustifications && <h2>Opposing Justifications</h2>}
          {hasJustifications && !hasNegativeJustifications && (
            <div style={{ textAlign: "center" }}>
              <div>None</div>
              <TextButton onClick={showNewNegativeJustificationDialog}>
                {t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
              </TextButton>
            </div>
          )}
          {map(negativeJustifications, toBranch)}
        </FlipMove>
      </GridCell>,
    ];
  }

  return <Grid>{branchesCells}</Grid>;
}
