import React, { Component, UIEvent } from "react";
import { Button, CircularProgress, FontIcon, ListItem } from "react-md";
import { connect, ConnectedProps } from "react-redux";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import sortBy from "lodash/sortBy";
import toLower from "lodash/toLower";
import { denormalize } from "normalizr";
import { RouteComponentProps } from "react-router";

import {
  EntityId,
  JustificationPolarities,
  JustificationRootPolarity,
  JustificationRootTargetType,
  makeCreateJustificationInputTargetingRoot,
  JustificationView,
  PersistedEntity,
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
import { PrimaryContextTrail } from "@/components/contextTrail/PrimaryContextTrailProvider";
import FocusValidatingContextTrail from "@/components/contextTrail/FocusValidatingContextTrail";
import { RootTargetProps } from "@/JustificationRootTargetViewer";

const justificationsPageId = "justifications-page";

interface MatchParams {
  rootTargetId: EntityId;
}
interface OwnProps extends RouteComponentProps<MatchParams> {
  rootTargetType: JustificationRootTargetType;
}

type Props = OwnProps & PropsFromRedux;

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

  static contextType = PrimaryContextTrail;

  componentDidMount() {
    const { rootTargetType, rootTargetId } = this.rootTargetInfo();
    this.props.justificationsPage.fetchRootJustificationTarget({
      rootTargetType,
      rootTargetId,
    });
  }

  componentDidUpdate(prevProps: Props) {
    const prevRootTargetInfo = rootTargetInfoFromProps(prevProps);
    const rootTargetInfo = this.rootTargetInfo();
    if (!isEqual(rootTargetInfo, prevRootTargetInfo)) {
      this.props.justificationsPage.fetchRootJustificationTarget(
        rootTargetInfo
      );
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
      rootTargetId,
      rootTarget,
      sortedJustifications,
      isNewJustificationDialogVisible,
      isFetching,
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

    const { contextTrailItems } = this.context;

    const onClickWritQuoteUrl =
      makeExtensionHighlightOnClickWritQuoteUrlCallback(dispatch);

    const rootTargetProps = {
      rootTargetType,
      rootTargetId,
      rootTarget,
    } as RootTargetProps;

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
          <FocusValidatingContextTrail
            id="justifications-page-context-trail"
            focusEntityType={rootTargetType}
            focusEntityId={rootTargetId}
            className="md-cell md-cell--12"
          />
          <div className="md-cell md-cell--12">
            <JustificationRootTargetCard
              id={this.id("root-target")}
              {...rootTargetProps}
              editorId={JustificationsPage.rootTargetEditorId}
              suggestionsKey={this.suggestionsKey("root-target")}
              extraMenuItems={rootTargetExtraMenuItems}
              contextTrailItem={
                contextTrailItems?.[contextTrailItems.length - 1]
              }
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
          id="justificationsPage"
          justifications={sortedJustifications}
          doShowControls={true}
          doShowJustifications={false}
          isUnCondensed={true}
          showBasisUrls={true}
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

function sortJustifications(
  justifications?: JustificationView[]
): JustificationView[];
function sortJustifications(
  justifications?: (PersistedEntity | JustificationView)[]
): (PersistedEntity | JustificationView)[];
function sortJustifications(
  justifications?: (PersistedEntity | JustificationView)[]
) {
  // Sort PersistedEntitys to the bottom
  justifications = sortBy(justifications, (j) =>
    "score" in j ? j.score : Number.MAX_VALUE
  );
  justifications = sortBy(justifications, (j) => {
    if ("score" in j) {
      return isDisverified(j) ? 1 : isVerified(j) ? -1 : 0;
    }
    return 2;
  });
  justifications.forEach((j: PersistedEntity | JustificationView) => {
    if ("counterJustifications" in j) {
      j.counterJustifications = sortJustifications(j.counterJustifications);
    }
  });
  return justifications;
}

const mapState = (state: RootState, ownProps: OwnProps) => {
  const { rootTargetType, rootTargetId } = rootTargetInfoFromProps(ownProps);

  if (!rootTargetType || !rootTargetId) {
    logger.error(`rootTargetType and rootTargetId are required`);
  }

  const schema = rootTargetNormalizationSchemasByType[rootTargetType];
  const rootTarget = denormalize(rootTargetId, schema, state.entities);

  const sortedJustifications = rootTarget
    ? sortJustifications(rootTarget.justifications)
    : [];

  return {
    ...state.justificationsPage,
    rootTargetType,
    rootTarget,
    rootTargetId,
    sortedJustifications,
  };
};

const rootTargetInfoFromProps = (props: OwnProps) => ({
  rootTargetType: props.rootTargetType,
  rootTargetId: props.match.params.rootTargetId,
});

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

export default connector(JustificationsPage);
