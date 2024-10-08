import React, { Component, UIEvent } from "react";
import { FontIcon } from "@react-md/icon";
import { connect, ConnectedProps } from "react-redux";
import { isEmpty, isEqual, sortBy, toLower } from "lodash";
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
import {
  extension,
  api,
  isVerified,
  isDisverified,
  mapActionCreatorGroupToDispatchToProps,
  rootTargetNormalizationSchemasByType,
  SuggestionsKey,
} from "howdju-client-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import Helmet from "@/Helmet";
import { apiLike, editors, ui, goto, flows } from "@/actions";
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
} from "@/viewModels";
import { makeExtensionHighlightOnClickWritQuoteUrlCallback } from "@/extensionCallbacks";
import { RootState } from "@/setupStore";
import { ComponentId } from "@/types";
import { PrimaryContextTrail } from "@/components/contextTrail/PrimaryContextTrailProvider";
import FocusValidatingContextTrail from "@/components/contextTrail/FocusValidatingContextTrail";
import { RootTargetProps } from "@/JustificationRootTargetViewer";
import TextButton from "@/components/button/TextButton";
import { MenuItem } from "@/components/menu/Menu";
import { Page } from "@/components/layout/Page";

import "./JustificationsPage.scss";

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
      <MenuItem
        primaryText="Add justification"
        key="addJustification"
        leftAddon={<FontIcon>add</FontIcon>}
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
      <Page id="justifications-page">
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

        <FocusValidatingContextTrail
          id="justifications-page-context-trail"
          focusEntityType={rootTargetType}
          focusEntityId={rootTargetId}
        />
        <JustificationRootTargetCard
          id={this.id("root-target")}
          {...rootTargetProps}
          editorId={JustificationsPage.rootTargetEditorId}
          suggestionsKey={this.suggestionsKey("root-target")}
          extraMenuItems={rootTargetExtraMenuItems}
          contextTrailItem={contextTrailItems?.[contextTrailItems.length - 1]}
        />

        {isFetching && (
          <CircularProgress key="progress" id="justifications-page-progress" />
        )}
        {!isFetching && !hasJustifications && (
          <div key="no-justifications-message">No justifications.</div>
        )}
        {hasJustifications || (
          <TextButton
            key="add-justification-button"
            onClick={this.showNewJustificationDialog}
          >
            {t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
          </TextButton>
        )}

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
      </Page>
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
    extension,
  })
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(JustificationsPage);
