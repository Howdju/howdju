import React, { Component, UIEvent } from "react";
import { Button, CircularProgress, FontIcon, ListItem } from "react-md";
import { connect, ConnectedProps } from "react-redux";
import forEach from "lodash/forEach";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import map from "lodash/map";
import sortBy from "lodash/sortBy";
import toLower from "lodash/toLower";
import { denormalize } from "normalizr";
import queryString from "query-string";
import { isArray } from "lodash";
import { RouteComponentProps } from "react-router";

import {
  ContextTrailItem,
  ContextTrailItemInfo,
  EntityId,
  JustificationPolarities,
  JustificationRootPolarity,
  JustificationRootTargetType,
  JustificationOut,
  makeCreateJustificationInputTargetingRoot,
  JustificationRef,
  parseContextTrail,
  ConnectingEntity,
} from "howdju-common";
import { actions, isVerified, isDisverified } from "howdju-client-common";

import Helmet from "@/Helmet";
import {
  api,
  apiLike,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
  goto,
  flows,
} from "@/actions";
import justificationsPage from "@/pages/justifications/justificationsPageSlice";
import * as characters from "@/characters";
import ContextTrail from "@/ContextTrail";
import JustificationsTree from "@/JustificationsTree";
import { logger } from "@/logger";
import CreateJustificationDialog from "@/CreateJustificationDialog";
import { EditorTypes } from "@/reducers/editors";
import JustificationRootTargetCard from "@/JustificationRootTargetCard";
import t, { ADD_JUSTIFICATION_CALL_TO_ACTION } from "@/texts";
import {
  combineIds,
  combineSuggestionsKeys,
  describeRootTarget,
  rootTargetNormalizationSchemasByType,
} from "@/viewModels";
import { makeExtensionHighlightOnClickWritQuoteUrlCallback } from "@/extensionCallbacks";
import { RootState } from "@/setupStore";
import { ComponentId, SuggestionsKey } from "@/types";

import "./JustificationsPage.scss";
import ErrorMessages from "@/ErrorMessages";

const justificationsPageId = "justifications-page";

interface MatchParams {
  rootTargetId: EntityId;
}
interface OwnProps extends RouteComponentProps<MatchParams> {
  rootTargetType: JustificationRootTargetType;
}

interface Props extends OwnProps, PropsFromRedux {}

class JustificationsPage extends Component<Props> {
  static id = justificationsPageId;
  static suggestionsKey = justificationsPageId;
  static transientId = "proposition-justifications-page-proposition";
  static rootTargetEditorId = combineIds(
    justificationsPageId,
    "root-target-editor"
  );
  static justificationEditorId = combineIds(
    justificationsPageId,
    "justification-editor"
  );

  componentDidMount() {
    const { rootTargetType, rootTargetId } = this.rootTargetInfo();
    this.props.justificationsPage.fetchRootJustificationTarget({
      rootTargetType,
      rootTargetId,
    });

    const { infos, hadInvalidInfos } = contextTrailItemInfosFromProps(
      this.props
    );
    if (!hadInvalidInfos && !isEmpty(infos)) {
      this.props.api.fetchContextTrail(infos, rootTargetType, rootTargetId);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const prevRootTargetInfo = rootTargetInfoFromProps(prevProps);
    const rootTargetInfo = this.rootTargetInfo();
    if (!isEqual(rootTargetInfo, prevRootTargetInfo)) {
      this.props.justificationsPage.fetchRootJustificationTarget(
        rootTargetInfo
      );
    }

    const { infos: prevInfos } = contextTrailItemInfosFromProps(prevProps);
    const { infos, hadInvalidInfos } = contextTrailItemInfosFromProps(
      this.props
    );
    if (!hadInvalidInfos && !isEqual(infos, prevInfos) && !isEmpty(infos)) {
      const { rootTargetType, rootTargetId } = rootTargetInfo;
      this.props.api.fetchContextTrail(infos, rootTargetType, rootTargetId);
    }
  }

  id = (...args: ComponentId[]) => combineIds(JustificationsPage.id, ...args);

  suggestionsKey = (...args: SuggestionsKey[]) =>
    combineSuggestionsKeys(JustificationsPage.suggestionsKey, ...args);

  rootTargetInfo = () => rootTargetInfoFromProps(this.props);

  showNewJustificationDialog = (
    _event: UIEvent,
    polarity?: JustificationRootPolarity
  ) => {
    const { rootTargetType, rootTargetId } = this.rootTargetInfo();
    const justification = makeCreateJustificationInputTargetingRoot(
      rootTargetType,
      rootTargetId,
      polarity
    );
    this.props.editors.beginEdit(
      EditorTypes.NEW_JUSTIFICATION,
      JustificationsPage.justificationEditorId,
      justification
    );

    this.props.justificationsPage.showNewJustificationDialog();
  };

  showNewPositiveJustificationDialog = (event: UIEvent) => {
    this.showNewJustificationDialog(event, JustificationPolarities.POSITIVE);
  };

  showNewNegativeJustificationDialog = (event: UIEvent) => {
    this.showNewJustificationDialog(event, JustificationPolarities.NEGATIVE);
  };

  cancelNewJustificationDialog = () => {
    this.props.justificationsPage.hideNewJustificationDialog();
  };

  render() {
    const {
      rootTargetType,
      rootTarget,
      contextTrailItems,
      hadInvalidInfos,
      sortedJustifications,
      isNewJustificationDialogVisible,
      isFetching,
      isInvalidContextTrail,
      dispatch,
    } = this.props;

    const hasJustifications = !isEmpty(sortedJustifications);

    const rootTargetExtraMenuItems = [
      <ListItem
        primaryText="Add justification"
        key="addJustification"
        leftIcon={<FontIcon>add</FontIcon>}
        onClick={this.showNewJustificationDialog}
      />,
    ];

    const onClickWritQuoteUrl =
      makeExtensionHighlightOnClickWritQuoteUrlCallback(dispatch);

    const contextTrail =
      hadInvalidInfos || isInvalidContextTrail ? (
        <ErrorMessages errors={["The context trail was invalid"]} />
      ) : (
        <ContextTrail
          id={this.id("context-trail")}
          trailItems={contextTrailItems}
          className="md-cell md-cell--12 "
        />
      );

    return (
      <div id="justifications-page">
        <Helmet>
          <title>
            {rootTarget
              ? describeRootTarget(rootTargetType, rootTarget)
              : `Loading ${describeRootTargetType(rootTargetType)}${
                  characters.ellipsis
                }`}{" "}
            — Howdju
          </title>
        </Helmet>

        <div className="md-grid md-grid--top">
          {contextTrail}
          <div className="md-cell md-cell--12">
            <JustificationRootTargetCard
              id={this.id("root-target")}
              rootTargetType={rootTargetType}
              rootTarget={rootTarget}
              editorId={JustificationsPage.rootTargetEditorId}
              suggestionsKey={this.suggestionsKey("root-target")}
              showJustificationCount={false}
              onShowNewJustificationDialog={this.showNewJustificationDialog}
              extraMenuItems={rootTargetExtraMenuItems}
            />
          </div>

          {isFetching && (
            <div className="md-grid md-grid--bottom">
              <div className="md-cell md-cell--12 cell--centered-contents">
                <CircularProgress
                  key="progress"
                  id="justifications-page-progress"
                />
              </div>
            </div>
          )}
          {!isFetching && !hasJustifications && (
            <div
              className="md-cell md-cell--12 cell--centered-contents"
              key="no-justifications-message"
            >
              <div>No justifications.</div>
            </div>
          )}
          {hasJustifications || (
            <div
              className="md-cell md-cell--12 cell--centered-contents"
              key="add-justification-button"
            >
              <Button
                flat
                children={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                onClick={this.showNewJustificationDialog}
              />
            </div>
          )}
        </div>

        <JustificationsTree
          justifications={sortedJustifications}
          doShowControls={true}
          doShowJustifications={false}
          isUnCondensed={true}
          showNewPositiveJustificationDialog={
            this.showNewPositiveJustificationDialog
          }
          showNewNegativeJustificationDialog={
            this.showNewNegativeJustificationDialog
          }
          contextTrailItems={contextTrailItems}
          onClickWritQuoteUrl={onClickWritQuoteUrl}
          className="md-grid--bottom"
        />

        {isNewJustificationDialogVisible && (
          <CreateJustificationDialog
            id={this.id("create-justification-dialog")}
            editorId={JustificationsPage.justificationEditorId}
            visible={isNewJustificationDialogVisible}
            onCancel={this.cancelNewJustificationDialog}
            commitAction={justificationsPage.hideNewJustificationDialog()}
            onHide={this.cancelNewJustificationDialog}
          />
        )}
      </div>
    );
  }
}

function describeRootTargetType(rootTargetType: JustificationRootTargetType) {
  return toLower(rootTargetType);
}

const sortJustifications = (
  justifications?: (JustificationRef | JustificationOut)[]
) => {
  // Sort JustificationRefs to the bottom
  justifications = sortBy(justifications, (j) =>
    "score" in j ? j.score : Number.MAX_VALUE
  );
  justifications = sortBy(justifications, (j) => {
    if ("score" in j) {
      return isDisverified(j) ? 1 : isVerified(j) ? -1 : 0;
    }
    return 2;
  });
  forEach(justifications, (j) => {
    if ("score" in j) {
      j.counterJustifications = sortJustifications(j.counterJustifications);
    }
  });
  return justifications;
};

const entitiesStoreKeyByConnectingEntityType = {
  JUSTIFICATION: "justifications",
} as const;

const mapState = (state: RootState, ownProps: OwnProps) => {
  const { rootTargetType, rootTargetId } = rootTargetInfoFromProps(ownProps);

  if (!rootTargetType || !rootTargetId) {
    logger.error(`rootTargetType and rootTargetId are required`);
  }

  const schema = rootTargetNormalizationSchemasByType[rootTargetType];
  const rootTarget = denormalize(rootTargetId, schema, state.entities);

  const { infos, hadInvalidInfos } = contextTrailItemInfosFromProps(ownProps);
  const contextTrailItems = hadInvalidInfos
    ? []
    : map(infos, (info) => toContextTrailItem(state, info));

  const sortedJustifications = rootTarget
    ? sortJustifications(rootTarget.justifications)
    : [];

  return {
    ...state.justificationsPage,
    rootTargetType,
    rootTarget,
    rootTargetId,
    contextTrailItems,
    hadInvalidInfos,
    sortedJustifications,
  };
};

const rootTargetInfoFromProps = (props: OwnProps) => ({
  rootTargetType: props.rootTargetType,
  rootTargetId: props.match.params.rootTargetId,
});

const contextTrailItemInfosFromProps = (props: OwnProps) => {
  const queryParams = queryString.parse(props.location.search);
  let contextTrailParam = queryParams["context-trail"];
  if (isArray(contextTrailParam)) {
    logger.error(
      `contextTrailParam can only appear once, but appeared multiple times: ${contextTrailParam}. Using first item.`
    );
    contextTrailParam = contextTrailParam[0];
  }
  if (!contextTrailParam) {
    return { infos: [], hadInvalidInfos: false };
  }
  const { infos, invalidInfos } = parseContextTrail(contextTrailParam);
  return { infos, hadInvalidInfos: !!invalidInfos };
};

const connector = connect(
  mapState,
  mapActionCreatorGroupToDispatchToProps({
    api,
    apiLike,
    ui,
    editors,
    goto,
    flows,
    justificationsPage,
    extension: actions.extension,
  })
);

type PropsFromRedux = ConnectedProps<typeof connector>;

function toContextTrailItem(
  state: RootState,
  item: ContextTrailItemInfo
): ContextTrailItem {
  const { connectingEntityType, connectingEntityId } = item;
  const storeKey = entitiesStoreKeyByConnectingEntityType[connectingEntityType];
  // TODO(261): remove typecast if we type the entities reducer/state.
  const connectingEntity = (state.entities[storeKey] as any)?.[
    connectingEntityId
  ] as ConnectingEntity;
  const polarity = connectingEntity.polarity;
  return {
    connectingEntityType,
    connectingEntityId,
    connectingEntity,
    polarity,
  };
}

export default connector(JustificationsPage);
