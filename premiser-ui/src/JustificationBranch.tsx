import { FontIcon } from "@react-md/icon";
import cn from "classnames";
import get from "lodash/get";
import map from "lodash/map";
import moment from "moment";
import React, { useState } from "react";
import FlipMove from "react-flip-move";
import { connect, ConnectedProps } from "react-redux";
import { Link } from "react-router-dom";

import { isDisverified, isVerified } from "howdju-client-common";
import {
  ContextTrailItem,
  isRootNegative,
  isRootPositive,
  isWritQuoteBased,
  JustificationSearchFilters,
  JustificationView,
  makeCreateCounterJustificationInput,
  newExhaustedEnumError,
} from "howdju-common";
import { api } from "howdju-client-common";

import {
  DropdownMenu,
  MenuItem,
  MenuItemLink,
  MenuItemSeparator,
} from "@/components/menu/Menu";
import { Card, CardContent } from "@/components/card/Card";
import CounterJustificationEditor from "@/editors/CounterJustificationEditor";
import { editors } from "./actions";
import IconButton from "./components/button/IconButton";
import config from "./config";
import {
  counterJustificationEditorId,
  justificationBasisEditorId,
} from "./editorIds";
import { useAppDispatch } from "./hooks";
import JustificationChatBubble from "./JustificationChatBubble";
import { logger } from "./logger";
import paths from "./paths";
import { EditorTypes } from "./reducers/editors";
import { RootState } from "./setupStore";
import t from "./texts";
import { OnClickJustificationWritQuoteUrl } from "./types";
import { makeContextTrailItems } from "./viewModels";

import "./JustificationBranch.scss";
import { formatTimestampForDisplay } from "./util";

interface OwnProps {
  justification: JustificationView;
  doShowControls?: boolean;
  doShowBasisJustifications: boolean;
  isCondensed?: boolean;
  isUnCondensed?: boolean;
  showBasisUrls: boolean;
  contextTrailItems?: ContextTrailItem[];
  showStatusText: boolean;
  onClickWritQuoteUrl?: OnClickJustificationWritQuoteUrl;
}

interface Props extends OwnProps, PropsFromRedux {}

function JustificationBranch({
  justification,
  newCounterJustification,
  doShowControls = true,
  doShowBasisJustifications,
  isCondensed = false,
  isUnCondensed = false,
  showBasisUrls,
  contextTrailItems,
  showStatusText,
  onClickWritQuoteUrl,
}: Props) {
  const [isOver, setIsOver] = useState(false);
  const [
    areCounterJustificationsExpanded,
    setAreCounterJustificationsExpanded,
  ] = useState(true);

  function onBubbleMouseOver() {
    setIsOver(true);
  }

  function onBubbleMouseLeave() {
    setIsOver(false);
  }

  const dispatch = useAppDispatch();

  function onVerify() {
    if (isVerified(justification)) {
      dispatch(api.unVerifyJustification(justification));
    } else {
      dispatch(api.verifyJustification(justification));
    }
  }

  function onDisverify() {
    if (isDisverified(justification)) {
      dispatch(api.unDisverifyJustification(justification));
    } else {
      dispatch(api.disverifyJustification(justification));
    }
  }

  function deleteClick() {
    dispatch(api.deleteJustification(justification));
  }

  function onEditNewCounterJustification() {
    dispatch(
      editors.beginEdit(
        EditorTypes.COUNTER_JUSTIFICATION,
        counterJustificationEditorId(justification),
        makeCreateCounterJustificationInput(justification)
      )
    );
  }

  function onEditBasis() {
    const justificationBasis = justification.basis;
    const basisEditorType = justificationBasis.type;
    switch (basisEditorType) {
      case "WRIT_QUOTE":
        dispatch(
          editors.beginEdit(
            basisEditorType,
            justificationBasisEditorId(justificationBasis),
            justificationBasis.entity
          )
        );
        break;
      case "PROPOSITION_COMPOUND":
      case "MEDIA_EXCERPT":
        logger.error(`Unable to edit ${basisEditorType} justification basis`);
        break;
    }
  }

  function createJustificationPath() {
    const {
      type: basisType,
      entity: { id: basisId },
    } = justification.basis;
    return paths.createJustification(basisType, basisId);
  }

  function seeUsagesPath() {
    const justificationBasis = justification.basis;
    const params: JustificationSearchFilters = {};

    switch (justificationBasis.type) {
      case "WRIT_QUOTE":
        params.writQuoteId = justificationBasis.entity.id;
        break;
      case "PROPOSITION_COMPOUND":
        params.propositionCompoundId = justificationBasis.entity.id;
        break;
      case "MEDIA_EXCERPT":
        params.mediaExcerptId = justificationBasis.entity.id;
        break;
      default:
        throw newExhaustedEnumError(justificationBasis);
    }

    return paths.searchJustifications(params);
  }

  function toggleCounterJustificationsExpanded() {
    setAreCounterJustificationsExpanded(!areCounterJustificationsExpanded);
  }

  const _isVerified = isVerified(justification);
  const _isDisverified = isDisverified(justification);

  const _isWritQuoteBased = isWritQuoteBased(justification);
  const _isRootPositive = isRootPositive(justification);
  const _isRootNegative = isRootNegative(justification);

  const doHideControls = !isOver;

  const nextContextTrailItems = makeContextTrailItems(contextTrailItems, {
    connectingEntityType: "JUSTIFICATION",
    connectingEntity: justification,
  });

  const menu = (
    <DropdownMenu
      buttonType="icon"
      id={`justification-${justification.id}-context-menu`}
      className={cn({ hidden: doHideControls })}
      menuClassName="context-menu justification-context-menu"
      children={<FontIcon>more_vert</FontIcon>}
      title="Justification actions"
      items={[
        <MenuItem
          primaryText="Counter"
          key="counter"
          leftAddon={<FontIcon>reply</FontIcon>}
          onClick={onEditNewCounterJustification}
        />,
        <MenuItemLink
          primaryText="Use"
          key="use"
          title="Justify another proposition with this basis"
          leftAddon={<FontIcon>call_made</FontIcon>}
          component={Link}
          to={createJustificationPath()}
        />,
        <MenuItemLink
          primaryText="See usages"
          key="usages"
          title="See justifications using this basis"
          leftAddon={<FontIcon>call_merge</FontIcon>}
          component={Link}
          to={seeUsagesPath()}
        />,
        <MenuItemLink
          primaryText="Link"
          key="link"
          title="A link to this justification"
          leftAddon={<FontIcon>link</FontIcon>}
          component={Link}
          to={paths.justification(justification)}
        />,
        <MenuItemSeparator key="divider" />,
        <MenuItem
          primaryText="Edit"
          key="edit"
          leftAddon={<FontIcon>create</FontIcon>}
          className={cn({ hidden: !_isWritQuoteBased })}
          onClick={onEditBasis}
        />,
        <MenuItem
          primaryText="Delete"
          key="delete"
          leftAddon={<FontIcon>delete</FontIcon>}
          onClick={deleteClick}
        />,
      ]}
    />
  );

  const age = justification.created
    ? moment(justification.created).fromNow()
    : "";
  const created = justification.created
    ? formatTimestampForDisplay(justification.created)
    : "";
  const creatorName = get(justification, "creator.longName");
  const creatorNameDescription = (creatorName && ` by ${creatorName}`) || "";

  const actions = [
    <IconButton
      key="verifyButton"
      className={cn({
        verified: _isVerified,
        inactive: doHideControls,
        hiding: !_isVerified && doHideControls,
        otherSelected: _isDisverified,
      })}
      title="Verify this justification"
      onClick={onVerify}
    >
      <FontIcon>thumb_up</FontIcon>
    </IconButton>,
    <IconButton
      key="disverifyButton"
      className={cn({
        disverified: _isDisverified,
        inactive: doHideControls,
        hiding: !_isDisverified && doHideControls,
        otherSelected: _isVerified,
      })}
      title="Dis-verify this justification"
      onClick={onDisverify}
    >
      <FontIcon>thumb_down</FontIcon>
    </IconButton>,
    <IconButton
      key="counterButton"
      className={cn({
        hiding: doHideControls,
      })}
      title="Counter this justification"
      onClick={onEditNewCounterJustification}
    >
      <FontIcon>reply</FontIcon>
    </IconButton>,
  ];
  const hasCounterJustifications =
    justification.counterJustifications &&
    justification.counterJustifications.length > 0;
  if (hasCounterJustifications) {
    const toggleCounterJustificationsExpandedButtonIcon =
      areCounterJustificationsExpanded ? "expand_more" : "expand_less";
    actions.push(
      <IconButton
        key="toggleCounterJustificationsExpandedButton"
        className={cn({
          hiding: doHideControls,
        })}
        title={
          areCounterJustificationsExpanded
            ? t("Collapse counter-justifications")
            : t("Expand counter justifications")
        }
        onClick={toggleCounterJustificationsExpanded}
      >
        <FontIcon>{toggleCounterJustificationsExpandedButtonIcon}</FontIcon>
      </IconButton>
    );
  }
  actions.push(
    <div className="justification-status-text" key="justification-status-text">
      <span className="entity-status-text">
        created{creatorNameDescription} <span title={created}>{age}</span>
      </span>
    </div>
  );

  const flipMoveProps = config.ui.flipMove;
  const counterJustifications = (
    <div className="counter-justifications">
      <FlipMove {...flipMoveProps}>
        {hasCounterJustifications && (
          <h3 key={`justification-${justification.id}-counter-justifications`}>
            Counter Justifications
          </h3>
        )}
        {newCounterJustification && (
          <Card
            key="newCounterJustificationCard"
            className="justification-card"
            style={{ width: "100%" }}
          >
            <CardContent>
              <CounterJustificationEditor
                editorId={counterJustificationEditorId(justification)}
                id={`justification-${justification.id}-new-counter-justification-editor`}
              />
            </CardContent>
          </Card>
        )}
        {map(justification.counterJustifications, (j) => {
          // TODO(337) figure out a better way to distinguish between a Ref and a Persisted entity.
          if (!("polarity" in j)) {
            // The justification is just a Ref, not persisted
            // TODO(338) create a better placeholder
            return <div>Placeholder justification {j.id}</div>;
          }
          const id = `counter-justification-${j.id}-branch`;
          return (
            <div id={id} key={id} className="counter-justification-branch">
              <ConnectedJustificationBranch
                justification={j}
                doShowControls={doShowControls}
                doShowBasisJustifications={doShowBasisJustifications}
                isCondensed={isCondensed}
                isUnCondensed={isUnCondensed}
                contextTrailItems={nextContextTrailItems}
                showBasisUrls={showBasisUrls}
                showStatusText={showStatusText}
                onClickWritQuoteUrl={onClickWritQuoteUrl}
              />
            </div>
          );
        })}
      </FlipMove>
    </div>
  );

  return (
    <div
      className={cn("justification-tree", {
        positivey: _isRootPositive,
        negativey: _isRootNegative,
      })}
      id={`justification-${justification.id}-tree`}
    >
      <JustificationChatBubble
        id={`justification-${justification.id}-chat-bubble`}
        justification={justification}
        doShowControls={doShowControls}
        showBasisUrls={showBasisUrls}
        showStatusText={showStatusText}
        menu={menu}
        contextTrailItems={nextContextTrailItems}
        actions={<div className="actions">{actions}</div>}
        onMouseOver={onBubbleMouseOver}
        onMouseLeave={onBubbleMouseLeave}
        onClickWritQuoteUrl={onClickWritQuoteUrl}
      >
        {areCounterJustificationsExpanded && counterJustifications}
      </JustificationChatBubble>
    </div>
  );
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const justification = ownProps.justification;

  const newCounterJustification = get(state, [
    "editors",
    EditorTypes.COUNTER_JUSTIFICATION,
    counterJustificationEditorId(justification),
    "editEntity",
  ]);

  return {
    newCounterJustification,
  };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const ConnectedJustificationBranch = connector(JustificationBranch);

export default ConnectedJustificationBranch;
