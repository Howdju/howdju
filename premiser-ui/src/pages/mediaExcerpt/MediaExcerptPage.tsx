import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import {
  Button,
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
  makeCreateMediaExcerptCitationInput,
  makeCreateUrlLocatorInput,
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
import DeleteUrlLocatorsControl from "./DeleteUrlLocatorsControl";
import MediaExcerptUsages from "./MediaExcerptUsages";
import CreateMediaExcerptCitationsEditor from "./CreateMediaExcerptCitationsEditor";

interface MatchParams {
  mediaExcerptId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

const id = "media-excerpt-page";
const createUrlLocatorsEditorId = combineIds(id, "create-url-locators-editor");
const createCitationsEditorId = combineIds(id, "create-citations-editor");

export default function MediaExcerptPage(props: Props) {
  const dispatch = useAppDispatch();
  const { mediaExcerptId } = props.match.params;
  useEffect(() => {
    dispatch(api.fetchMediaExcerpt(mediaExcerptId));
    dispatch(api.fetchMediaExcerptApparitions(mediaExcerptId));
  }, [dispatch, mediaExcerptId]);

  const mediaExcerpt = useAppEntitySelector(mediaExcerptId, mediaExcerptSchema);

  const [
    isDeleteUrlLocatorsDialogVisible,
    setIsDeleteUrlLocatorsDialogVisible,
  ] = useState(false);

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

  function showAddCitationsDialog() {
    dispatch(mediaExcerptPage.showAddCitationsDialog());
  }
  function hideAddCitationsDialog() {
    dispatch(mediaExcerptPage.hideAddCitationsDialog());
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

  function onAddCitationsClick() {
    dispatch(
      editors.beginEdit(
        "CREATE_MEDIA_EXCERPT_CITATIONS",
        createUrlLocatorsEditorId,
        {
          mediaExcerptId,
          citations: [makeCreateMediaExcerptCitationInput()],
        }
      )
    );
    showAddCitationsDialog();
  }

  const {
    isFetching,
    isAddUrlLocatorsDialogVisible,
    isAddCitationsDialogVisible,
  } = useAppSelector((state) => state.mediaExcerptPage);

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
          primaryText="Use in Justification…"
          key="use-in-justification"
          title="Create a new justification based on this media excerpt."
          leftIcon={<MaterialSymbol icon="vertical_align_top" />}
          component={Link}
          to={paths.createJustification("MEDIA_EXCERPT", mediaExcerptId)}
        />,
        <ListItem
          primaryText="Use in Appearance…"
          key="use-in-appearance"
          leftIcon={<MaterialSymbol icon="add_location" />}
          component={Link}
          to={paths.createAppearance(mediaExcerptId)}
        />,
        <Divider key="divider-edit" />,
        <ListItem
          primaryText="Add URLs…"
          key="add-urls"
          leftIcon={<MaterialSymbol icon="add_link" />}
          onClick={onAddUrlLocatorsClick}
        />,
        <ListItem
          primaryText="Add Citations…"
          key="add-citations"
          leftIcon={<MaterialSymbol icon="auto_stories" />}
          onClick={onAddCitationsClick}
        />,
        <ListItem
          primaryText="Delete URLs…"
          key="delete-urls"
          leftIcon={<MaterialSymbol icon="link_off" />}
          onClick={() => setIsDeleteUrlLocatorsDialogVisible(true)}
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
      <MediaExcerptUsages mediaExcerptId={mediaExcerptId} />
      <DialogContainer
        id={combineIds(id, "add-url-locators-dialog")}
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
      <DialogContainer
        id={combineIds(id, "delete-url-locators-dialog")}
        visible={isDeleteUrlLocatorsDialogVisible}
        title="Delete URL locators"
        onHide={() => setIsDeleteUrlLocatorsDialogVisible(false)}
        className="md-overlay--wide-dialog"
      >
        <DeleteUrlLocatorsControl mediaExcerpt={mediaExcerpt} />
        <footer className="md-dialog-footer md-dialog-footer--inline">
          <Button
            raised
            primary
            onClick={() => setIsDeleteUrlLocatorsDialogVisible(false)}
          >
            Close
          </Button>
        </footer>
      </DialogContainer>
      <DialogContainer
        id={combineIds(id, "add-citations-dialog")}
        visible={isAddCitationsDialogVisible}
        title="Add citations"
        onHide={hideAddCitationsDialog}
        className="md-overlay--wide-dialog"
      >
        <CreateMediaExcerptCitationsEditor
          id="media-excerpt-page--create-citations-editor"
          editorId={createCitationsEditorId}
          showButtons={true}
          submitButtonText="Add"
          editorCommitBehavior={
            new CommitThenPutAction(mediaExcerptPage.hideAddCitationsDialog())
          }
        />
      </DialogContainer>
    </div>
  );
}
