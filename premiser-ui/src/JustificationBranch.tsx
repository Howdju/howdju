import cn from "classnames";
import get from "lodash/get";
import map from "lodash/map";
import moment from "moment";
import React, { useState } from "react";
import FlipMove from "react-flip-move";
import { Link } from "react-router-dom";
import { connect, ConnectedProps } from "react-redux";
import {
  Divider,
  Card,
  Button,
  FontIcon,
  MenuButton,
  ListItem,
  DropdownMenu,
} from "react-md";

import {
  isWritQuoteBased,
  isRootPositive,
  isRootNegative,
  JustificationSearchFilters,
  newExhaustedEnumError,
  makeCreateCounterJustificationInput,
  JustificationOut,
  ContextTrailItem,
  newUnimplementedError,
} from "howdju-common";
import { isVerified, isDisverified } from "howdju-client-common";

import { api, editors } from "./actions";
import config from "./config";
import CounterJustificationEditor from "@/editors/CounterJustificationEditor";
import {
  counterJustificationEditorId,
  justificationBasisEditorId,
} from "./editorIds";
import JustificationChatBubble from "./JustificationChatBubble";
import paths from "./paths";
import { EditorTypes } from "./reducers/editors";
import t from "./texts";

import "./JustificationBranch.scss";
import { extendContextTrailItems } from "./viewModels";
import { useAppDispatch } from "./hooks";
import { RootState } from "./setupStore";
import { OnClickJustificationWritQuoteUrl } from "./types";
import { logger } from "./logger";

interface OwnProps {
  justification: JustificationOut;
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
  contextTrailItems = [],
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
      case "PROPOSITION_COMPOUND":
        logger.error("Unable to edit proposition compound justification basis");
        break;
      case "SOURCE_EXCERPT":
        throw newUnimplementedError(
          "Cannot edit SourceExcerpt justification basis."
        );
      case "WRIT_QUOTE":
        dispatch(
          editors.beginEdit(
            basisEditorType,
            justificationBasisEditorId(justificationBasis),
            justificationBasis.entity
          )
        );
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
      case "SOURCE_EXCERPT":
        throw newUnimplementedError(
          "Cannot filter justification by basis SourceExcerpt."
        );
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

  // TODO(17): pass props directly after upgrading react-md to a version with correct types
  const menuClassNameProps = {
    menuClassName: "context-menu justification-context-menu",
  } as any;
  const menu = (
    <MenuButton
      icon
      id={`justification-${justification.id}-context-menu`}
      className={cn({ hidden: doHideControls })}
      {...menuClassNameProps}
      children={"more_vert"}
      position={DropdownMenu.Positions.TOP_RIGHT}
      title="Justification actions"
      menuItems={[
        <ListItem
          primaryText="Counter"
          key="counter"
          leftIcon={<FontIcon>reply</FontIcon>}
          onClick={onEditNewCounterJustification}
        />,
        <ListItem
          primaryText="Use"
          key="use"
          title="Justify another proposition with this basis"
          leftIcon={<FontIcon>call_made</FontIcon>}
          component={Link}
          to={createJustificationPath()}
        />,
        <ListItem
          primaryText="See usages"
          key="usages"
          title="See justifications using this basis"
          leftIcon={<FontIcon>call_merge</FontIcon>}
          component={Link}
          to={seeUsagesPath()}
        />,
        <ListItem
          primaryText="Link"
          key="link"
          title="A link to this justification"
          leftIcon={<FontIcon>link</FontIcon>}
          component={Link}
          to={paths.justification(justification)}
        />,
        <Divider key="divider" />,
        <ListItem
          primaryText="Edit"
          key="edit"
          leftIcon={<FontIcon>create</FontIcon>}
          className={cn({ hidden: !_isWritQuoteBased })}
          onClick={onEditBasis}
        />,
        <ListItem
          primaryText="Delete"
          key="delete"
          leftIcon={<FontIcon>delete</FontIcon>}
          onClick={deleteClick}
        />,
      ]}
    />
  );

  const age = justification.created
    ? moment(justification.created).fromNow()
    : "";
  const created = justification.created
    ? moment(justification.created).format(config.humanDateTimeFormat)
    : "";
  const creatorName = get(justification, "creator.longName");
  const creatorNameDescription = (creatorName && ` by ${creatorName}`) || "";

  const actions = [
    <Button
      icon
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
      thumb_up
    </Button>,
    <Button
      icon
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
      thumb_down
    </Button>,
    <Button
      icon
      key="counterButton"
      className={cn({
        hiding: doHideControls,
      })}
      title="Counter this justification"
      onClick={onEditNewCounterJustification}
    >
      reply
    </Button>,
  ];
  const hasCounterJustifications =
    justification.counterJustifications &&
    justification.counterJustifications.length > 0;
  if (hasCounterJustifications) {
    const toggleCounterJustificationsExpandedButtonIcon =
      areCounterJustificationsExpanded ? "expand_more" : "expand_less";
    actions.push(
      <Button
        icon
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
        {toggleCounterJustificationsExpandedButtonIcon}
      </Button>
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
          >
            <CounterJustificationEditor
              editorId={counterJustificationEditorId(justification)}
              id={`justification-${justification.id}-new-counter-justification-editor`}
            />
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
          const nextContextTrailItems = extendContextTrailItems(
            contextTrailItems,
            "JUSTIFICATION",
            j
          );
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
        className="md-grid"
        justification={justification}
        doShowControls={doShowControls}
        showBasisUrls={showBasisUrls}
        showStatusText={showStatusText}
        menu={menu}
        contextTrailItems={contextTrailItems}
        actions={<div className="md-cell md-cell--12 actions">{actions}</div>}
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
