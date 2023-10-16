import React from "react";
import cn from "classnames";
import concat from "lodash/concat";
import some from "lodash/some";
import { FontIcon } from "@react-md/icon";
import { Link } from "react-router-dom";
import { connect, ConnectedProps } from "react-redux";
import { push } from "connected-react-router";

import {
  EntityId,
  isNegative,
  isPositive,
  JustificationBasisSourceTypes,
  JustificationRootTargetType,
  JustificationRootTargetTypes,
  logger,
  toJson,
  ContextTrailItem,
} from "howdju-common";
import {
  isPropositionRootTarget,
  isVerified,
  makeCreateContentReportInput,
  toUpdatePropositionInput,
} from "howdju-client-common";

import { DropdownMenu, MenuItem, MenuItemLink } from "@/components/menu/Menu";
import { Card, CardContent } from "@/components/card/Card";
import JustificationRootTargetViewer, {
  RootTargetProps,
} from "./JustificationRootTargetViewer";
import PropositionTagger from "./PropositionTagger";
import { EditorTypes } from "./reducers/editors";
import paths from "./paths";
import Tagger from "./Tagger";
import { combineIds, combineSuggestionsKeys } from "./viewModels";
import {
  api,
  editors,
  flows,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from "./actions";
import app from "./app/appSlice";
import { divideMenuItems } from "./util";
import { contentReportEditorId } from "./content-report/ReportContentDialog";
import { ComponentId, EditorId, MenuItems, SuggestionsKey } from "./types";
import TreePolarity from "@/components/TreePolarity";

import "./JustificationRootTargetCard.scss";

const editorTypesByRootTargetType = {
  [JustificationRootTargetTypes.PROPOSITION]: EditorTypes.PROPOSITION,
};

type OwnProps = {
  id: ComponentId;
  editorId: EditorId;
  suggestionsKey: SuggestionsKey;
  extraMenuItems: MenuItems;
  /** The context trail item relating to this root target. */
  contextTrailItem?: ContextTrailItem;
} & RootTargetProps;

type Props = OwnProps & PropsFromRedux;

/** A card displaying anything that can be justified. */
class JustificationRootTargetCard extends React.Component<Props> {
  state = {
    isOver: false,
  };

  render() {
    const {
      id,
      editorId,
      suggestionsKey,
      rootTargetType,
      rootTargetId,
      rootTarget,
      extraMenuItems,
      contextTrailItem,
    } = this.props;
    const { isOver } = this.state;

    const hasAgreement =
      rootTarget &&
      some(rootTarget.justifications, (j) => isVerified(j) && isPositive(j));
    const hasDisagreement =
      rootTarget &&
      some(rootTarget.justifications, (j) => isVerified(j) && isNegative(j));

    const doHideControls = !isOver;

    const baseEditMenuItems = [
      <MenuItem
        primaryText="Delete"
        key="delete"
        leftAddon={<FontIcon>delete</FontIcon>}
        onClick={this.deleteRootTarget}
      />,
    ];
    const { entity: typeEntityMenuItems, edit: typeEditMenuItems } =
      this.menuItemsForType(rootTargetType, rootTargetId);

    const entityMenuItems = concat(extraMenuItems, typeEntityMenuItems);
    const editMenuItems = concat(typeEditMenuItems, baseEditMenuItems);
    const reportMenuItems = [
      <MenuItem
        primaryText="Report"
        key="report"
        leftAddon={<FontIcon>flag</FontIcon>}
        onClick={this.showReportContentDialog}
      />,
    ];

    const menuItems = divideMenuItems(
      entityMenuItems,
      editMenuItems,
      reportMenuItems
    );

    const menu = (
      <DropdownMenu
        buttonType="icon"
        id={combineIds(id, "menu")}
        className={cn({ hidden: doHideControls })}
        menuClassName="context-menu context-menu--proposition"
        children={<FontIcon>more_vert</FontIcon>}
        items={menuItems}
        title="Actions"
      />
    );

    const rootTargetProps = {
      rootTargetType,
      rootTargetId,
      rootTarget,
    } as RootTargetProps;

    return (
      <TreePolarity polarity={contextTrailItem?.polarity}>
        <div className="root-target-background">
          <Card
            style={{ width: "100%" }}
            className={cn("root-target-card", {
              agreement: hasAgreement,
              disagreement: hasDisagreement,
            })}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
          >
            <CardContent className="root-target-card-contents">
              <JustificationRootTargetViewer
                id={combineIds(id, "proposition-entity-viewer")}
                {...rootTargetProps}
                editorId={editorId}
                suggestionsKey={combineSuggestionsKeys(
                  suggestionsKey,
                  "proposition"
                )}
                menu={menu}
                showJustificationCount={false}
                contextTrailItem={contextTrailItem}
              />
              {rootTarget &&
                rootTargetType !== JustificationRootTargetTypes.PROPOSITION && (
                  <Tagger
                    targetType={rootTargetType}
                    target={rootTarget}
                    id={combineIds(id, "tagger")}
                    suggestionsKey={combineSuggestionsKeys(
                      suggestionsKey,
                      "tagger"
                    )}
                  />
                )}
              {rootTarget &&
                rootTargetType === JustificationRootTargetTypes.PROPOSITION && (
                  <PropositionTagger
                    propositionId={rootTarget.id}
                    tags={rootTarget.tags}
                    votes={rootTarget.propositionTagVotes || []}
                    recommendedTags={rootTarget.recommendedTags}
                    id={combineIds(id, "proposition-tagger")}
                    suggestionsKey={combineSuggestionsKeys(
                      suggestionsKey,
                      "proposition-tagger"
                    )}
                    autoFocus={true}
                  />
                )}
            </CardContent>
          </Card>
        </div>
      </TreePolarity>
    );
  }

  showReportContentDialog = () => {
    const {
      rootTargetType: entityType,
      rootTarget: { id: entityId },
    } = this.props;
    const url = window.location.href;
    // TODO(272): replace this with this.props.flows.startContentReport({entityType, entityId, url}) that
    // encapsulates the showing of the dialog, the starting of the edit, and the creation of the
    // form input model
    this.props.editors.beginEdit(
      "CONTENT_REPORT",
      contentReportEditorId,
      makeCreateContentReportInput({ entityType, entityId, url })
    );
  };

  menuItemsForType(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId
  ): { entity: JSX.Element[]; edit: JSX.Element[] } {
    switch (rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION: {
        return {
          entity: [
            <MenuItemLink
              primaryText="Use"
              key="use"
              title="Justify another proposition with this one"
              leftAddon={<FontIcon>call_made</FontIcon>}
              component={Link}
              to={this.createJustificationPath(rootTargetId)}
            />,
            <MenuItemLink
              primaryText="See usages"
              key="usages"
              title={`See usages of this proposition`}
              leftAddon={<FontIcon>call_merge</FontIcon>}
              component={Link}
              to={paths.propositionUsages(rootTargetId)}
            />,
          ],
          edit: [
            <MenuItem
              primaryText="Edit"
              key="edit"
              leftAddon={<FontIcon>edit</FontIcon>}
              onClick={this.editRootTarget}
            />,
          ],
        };
      }
      // Statements are not directly editable. To change their contents, one must edit their
      // persorgs/propositions. To change the relation, one must create a new statement.
      case JustificationRootTargetTypes.STATEMENT:
      default:
        return { entity: [], edit: [] };
    }
  }

  createJustificationPath = (propositionId: EntityId) => {
    return paths.createJustification(
      JustificationBasisSourceTypes.PROPOSITION,
      propositionId
    );
  };

  editRootTarget = () => {
    const { rootTargetType, editorId, rootTarget } = this.props;
    if (rootTargetType !== "PROPOSITION") {
      logger.error(`Editing a ${rootTargetType} is not supported`);
      return;
    }
    if (!isPropositionRootTarget(rootTarget)) {
      logger.error(
        `Expected rootTarget to be a proposition, but it was not. rootTargetType: ${rootTargetType}, rootTarget: ${toJson(
          rootTarget
        )}`
      );
    }
    const editorType = editorTypesByRootTargetType[rootTargetType];
    this.props.editors.beginEdit(
      editorType,
      editorId,
      toUpdatePropositionInput(rootTarget)
    );
  };

  deleteRootTarget = () => {
    switch (this.props.rootTargetType) {
      case "PROPOSITION":
        this.props.flows.apiActionOnSuccess(
          api.deleteProposition(this.props.rootTarget.id),
          app.addToast("Deleted Proposition"),
          push(paths.home())
        );
        break;
      case "STATEMENT":
        logger.error("deleting statements is unimplemented");
        break;
    }
  };

  onMouseOver = () => {
    this.setState({ isOver: true });
  };

  onMouseLeave = () => {
    this.setState({ isOver: false });
  };
}

const connector = connect(
  null,
  mapActionCreatorGroupToDispatchToProps({
    api,
    editors,
    flows,
    ui,
  })
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(JustificationRootTargetCard);
