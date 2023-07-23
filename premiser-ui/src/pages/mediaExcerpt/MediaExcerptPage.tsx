import React, { useEffect } from "react";
import { RouteComponentProps } from "react-router";
import {
  CircularProgress,
  DialogContainer,
  Divider,
  DropdownMenu,
  ListItem,
  MenuButton,
} from "react-md";
import { MaterialSymbol } from "react-material-symbols";
import { Link } from "react-router-dom";
import { push } from "connected-react-router";

import {
  EntityId,
  makeCreateUrlLocatorInput,
  newUnimplementedError,
} from "howdju-common";

import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { api } from "@/apiActions";
import { mediaExcerptSchema } from "@/normalizationSchemas";
import { combineIds } from "@/viewModels";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import HowdjuHelmet from "@/Helmet";
import paths from "@/paths";
import { editors, flows } from "@/actions";
import app from "@/app/appSlice";
import mediaExcerptPage from "./mediaExcerptPageSlice";
import CreateUrlLocatorsEditor from "@/editors/CreateUrlLocatorsEditor";
import { CommitThenPutAction } from "@/editors/withEditor";

interface MatchParams {
  mediaExcerptId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

const id = "media-excerpt-page";
const createUrlLocatorsEditorId = "mediaExcerptPage-addUrls";

export default function MediaExcerptPage(props: Props) {
  const dispatch = useAppDispatch();
  const { mediaExcerptId } = props.match.params;
  useEffect(() => {
    dispatch(api.fetchMediaExcerpt(mediaExcerptId));
  }, [dispatch, mediaExcerptId]);

  const mediaExcerpt = useAppEntitySelector(mediaExcerptId, mediaExcerptSchema);

  function useInAppearance() {
    throw newUnimplementedError("useInAppearance");
  }
  function deleteMediaExcerpt() {
    dispatch(
      flows.apiActionOnSuccess(
        api.deleteMediaExcerpt(mediaExcerptId),
        app.addToast("Deleted Media Excerpt."),
        push(paths.home())
      )
    );
  }

  function showAddUrlLocatorsDialog() {
    dispatch(mediaExcerptPage.showAddUrlLocatorsDialog());
  }
  function hideAddUrlLocatorsDialog() {
    dispatch(mediaExcerptPage.hideAddUrlLocatorsDialog());
  }

  function onAddUrlLocatorsClick() {
    dispatch(
      editors.beginEdit("CREATE_URL_LOCATORS", createUrlLocatorsEditorId, {
        mediaExcerptId,
        urlLocators: [makeCreateUrlLocatorInput()],
      })
    );
    showAddUrlLocatorsDialog();
  }

  const { isFetching, isAddUrlLocatorsDialogVisible } = useAppSelector(
    (state) => state.mediaExcerptPage
  );

  // TODO(17): pass props directly after upgrading react-md to a version with correct types
  const menuClassNameProps = { menuClassName: "context-menu" } as any;
  const menu = (
    <MenuButton
      icon
      id={combineIds(id, "menu")}
      {...menuClassNameProps}
      children={"more_vert"}
      position={DropdownMenu.Positions.TOP_RIGHT}
      menuItems={[
        <ListItem
          primaryText="Use in Justification"
          key="use-in-justification"
          title="Create a new justification based on this media excerpt."
          leftIcon={<MaterialSymbol icon="vertical_align_top" />}
          component={Link}
          to={paths.createJustification("MEDIA_EXCERPT", mediaExcerptId)}
        />,
        <ListItem
          primaryText="Use in Appearance"
          key="use-in-appearance"
          leftIcon={<MaterialSymbol icon="upgrade" />}
          onClick={useInAppearance}
        />,
        <Divider key="divider-use" />,
        <ListItem
          primaryText="See usages"
          key="see-usages"
          leftIcon={<MaterialSymbol icon="search" />}
          component={Link}
          to={paths.mediaExcerptUsages(mediaExcerptId)}
        />,
        <Divider key="divider-edit" />,
        <ListItem
          primaryText="Add URLs"
          key="add-urls"
          leftIcon={<MaterialSymbol icon="add_link" />}
          onClick={onAddUrlLocatorsClick}
        />,
        <Divider key="divider-delete" />,
        <ListItem
          primaryText="Delete"
          key="delete"
          leftIcon={<MaterialSymbol icon="delete" />}
          onClick={deleteMediaExcerpt}
        />,
      ]}
    />
  );

  const title = `Media Excerpt ${mediaExcerptId}`;

  if (!mediaExcerpt) {
    if (isFetching) {
      return <CircularProgress id={combineIds(id, "progress")} />;
    }
    return <div id={id}>Media Excerpt not found.</div>;
  }
  return (
    <div id={id} className="md-grid">
      <HowdjuHelmet>
        <title>{title} — Howdju</title>
      </HowdjuHelmet>
      <h1 className="md-cell md-cell--12">{title}</h1>
      <MediaExcerptCard
        id={combineIds(id, "media-excerpt-card")}
        mediaExcerpt={mediaExcerpt}
        menu={menu}
        className="md-cell md-cell--12"
      />
      <DialogContainer
        id={combineIds(id, "add-url-dialog")}
        visible={isAddUrlLocatorsDialogVisible}
        title="Add URL locators"
        onHide={hideAddUrlLocatorsDialog}
        className="md-overlay--wide-dialog"
      >
        <CreateUrlLocatorsEditor
          id="media-excerpt-page--create-url-locators-editor"
          editorId={createUrlLocatorsEditorId}
          showButtons={true}
          submitButtonText="Add"
          editorCommitBehavior={
            new CommitThenPutAction(mediaExcerptPage.hideAddUrlLocatorsDialog())
          }
        />
      </DialogContainer>
    </div>
  );
}
