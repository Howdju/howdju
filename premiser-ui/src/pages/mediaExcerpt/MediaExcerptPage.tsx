import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import {
  CircularProgress,
  Divider,
  DropdownMenu,
  ListItem,
  MenuButton,
} from "react-md";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@react-md/dialog";
import { MaterialSymbol } from "react-material-symbols";
import { Link } from "react-router-dom";
import { push } from "connected-react-router";

import {
  EntityId,
  makeCreateMediaExcerptCitationInput,
  makeCreateMediaExcerptSpeakerInput,
  makeCreateUrlLocatorInput,
} from "howdju-common";

import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { api } from "@/apiActions";
import { mediaExcerptSchema } from "@/normalizationSchemas";
import { combineEditorIds, combineIds } from "@/viewModels";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import HowdjuHelmet from "@/Helmet";
import paths from "@/paths";
import { editors, flows } from "@/actions";
import app from "@/app/appSlice";
import mediaExcerptPage from "./mediaExcerptPageSlice";
import CreateUrlLocatorsEditor from "@/editors/CreateUrlLocatorsEditor";
import { CancelThenPutAction, CommitThenPutAction } from "@/editors/withEditor";
import DeleteUrlLocatorsControl from "./DeleteUrlLocatorsControl";
import MediaExcerptUsages from "./MediaExcerptUsages";
import CreateMediaExcerptCitationsEditor from "./CreateMediaExcerptCitationsEditor";
import DeleteMediaExcerptCitationsControl from "./DeleteMediaExcerptCitationsControl";
import DeleteMediaExcerptSpeakersControl from "./DeleteMediaExcerptSpeakersControl";
import CreateMediaExcerptSpeakersEditor from "./CreateMediaExcerptSpeakersEditor";
import SolidButton from "@/components/button/SolidButton";

interface MatchParams {
  mediaExcerptId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

const id = "media-excerpt-page";
const createUrlLocatorsEditorId = combineEditorIds(
  id,
  "create-url-locators-editor"
);
const createCitationsEditorId = combineEditorIds(id, "create-citations-editor");
const createSpeakersEditorId = combineEditorIds(id, "create-speakers-editor");

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
  const [isDeleteCitationsDialogVisible, setIsDeleteCitationsDialogVisible] =
    useState(false);
  const [isDeleteSpeakersDialogVisible, setIsDeleteSpeakersDialogVisible] =
    useState(false);

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

  function showAddSpeakersDialog() {
    dispatch(mediaExcerptPage.showAddSpeakersDialog());
  }
  function hideAddSpeakersDialog() {
    dispatch(mediaExcerptPage.hideAddSpeakersDialog());
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
        createCitationsEditorId,
        {
          mediaExcerptId,
          citations: [makeCreateMediaExcerptCitationInput()],
        }
      )
    );
    showAddCitationsDialog();
  }

  function onAddSpeakersClick() {
    dispatch(
      editors.beginEdit(
        "CREATE_MEDIA_EXCERPT_SPEAKERS",
        createSpeakersEditorId,
        {
          mediaExcerptId,
          speakers: [makeCreateMediaExcerptSpeakerInput()],
        }
      )
    );
    showAddSpeakersDialog();
  }

  const {
    isFetching,
    isAddUrlLocatorsDialogVisible,
    isAddCitationsDialogVisible,
    isAddSpeakersDialogVisible,
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
          primaryText="Add Speakers…"
          key="add-speakers"
          leftIcon={<MaterialSymbol icon="record_voice_over" />}
          onClick={onAddSpeakersClick}
        />,
        <ListItem
          primaryText="Delete URLs…"
          key="delete-urls"
          leftIcon={<MaterialSymbol icon="link_off" />}
          onClick={() => setIsDeleteUrlLocatorsDialogVisible(true)}
        />,
        <ListItem
          primaryText="Delete Citations…"
          key="delete-citations"
          leftIcon={<MaterialSymbol icon="auto_stories" />}
          onClick={() => setIsDeleteCitationsDialogVisible(true)}
        />,
        <ListItem
          primaryText="Delete Speakers…"
          key="delete-speakers"
          leftIcon={<MaterialSymbol icon="voice_over_off" />}
          onClick={() => setIsDeleteCitationsDialogVisible(true)}
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
      <Dialog
        id={combineIds(id, "add-url-locators-dialog")}
        visible={isAddUrlLocatorsDialogVisible}
        onRequestClose={hideAddUrlLocatorsDialog}
        aria-labelledby={combineIds(id, "add-url-locators-dialog", "title")}
      >
        <DialogHeader>
          <DialogTitle id={combineIds(id, "add-url-locators-dialog", "title")}>
            Add URL locators
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <CreateUrlLocatorsEditor
            id="media-excerpt-page--create-url-locators-editor"
            editorId={createUrlLocatorsEditorId}
            showButtons={true}
            submitButtonText="Add"
            commitBehavior={
              new CommitThenPutAction(
                mediaExcerptPage.hideAddUrlLocatorsDialog()
              )
            }
            cancelBehavior={
              new CancelThenPutAction(
                mediaExcerptPage.hideAddUrlLocatorsDialog()
              )
            }
          />
        </DialogContent>
      </Dialog>
      <Dialog
        id={combineIds(id, "delete-url-locators-dialog")}
        visible={isDeleteUrlLocatorsDialogVisible}
        onRequestClose={() => setIsDeleteUrlLocatorsDialogVisible(false)}
        aria-labelledby={combineIds(id, "delete-url-locators-dialog", "title")}
      >
        <DialogHeader>
          <DialogTitle
            id={combineIds(id, "delete-url-locators-dialog", "title")}
          >
            Delete URL locators
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <DeleteUrlLocatorsControl mediaExcerpt={mediaExcerpt} />
        </DialogContent>
        <DialogFooter>
          <SolidButton
            onClick={() => setIsDeleteUrlLocatorsDialogVisible(false)}
          >
            Close
          </SolidButton>
        </DialogFooter>
      </Dialog>
      <Dialog
        id={combineIds(id, "add-citations-dialog")}
        visible={isAddCitationsDialogVisible}
        onRequestClose={hideAddCitationsDialog}
        aria-labelledby={combineIds(id, "add-citations-dialog", "title")}
      >
        <DialogHeader>
          <DialogTitle title={combineIds(id, "add-citations-dialog", "title")}>
            Add citations
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <CreateMediaExcerptCitationsEditor
            id="media-excerpt-page--create-citations-editor"
            editorId={createCitationsEditorId}
            showButtons={true}
            submitButtonText="Add"
            commitBehavior={
              new CommitThenPutAction(mediaExcerptPage.hideAddCitationsDialog())
            }
            cancelBehavior={
              new CancelThenPutAction(mediaExcerptPage.hideAddCitationsDialog())
            }
          />
        </DialogContent>
      </Dialog>
      <Dialog
        id={combineIds(id, "delete-media-excerpt-citations-dialog")}
        visible={isDeleteCitationsDialogVisible}
        onRequestClose={() => setIsDeleteCitationsDialogVisible(false)}
        aria-labelledby={combineIds(
          id,
          "delete-media-excerpt-citations-dialog-title"
        )}
      >
        <DialogHeader>
          <DialogTitle
            title={combineIds(
              id,
              "delete-media-excerpt-citations-dialog-title"
            )}
          >
            Delete citations
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <DeleteMediaExcerptCitationsControl mediaExcerpt={mediaExcerpt} />
        </DialogContent>
        <DialogFooter>
          <SolidButton onClick={() => setIsDeleteCitationsDialogVisible(false)}>
            Close
          </SolidButton>
        </DialogFooter>
      </Dialog>
      <Dialog
        id={combineIds(id, "add-speakers-dialog")}
        visible={isAddSpeakersDialogVisible}
        onRequestClose={hideAddSpeakersDialog}
        aria-labelledby={combineIds(id, "add-speakers-dialog-title")}
      >
        <DialogHeader>
          <DialogTitle id={combineIds(id, "add-speakers-dialog-title")}>
            Add speakers
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <CreateMediaExcerptSpeakersEditor
            id={combineIds(id, "create-speakers-editor")}
            editorId={createSpeakersEditorId}
            showButtons={true}
            submitButtonText="Add"
            commitBehavior={
              new CommitThenPutAction(mediaExcerptPage.hideAddSpeakersDialog())
            }
          />
        </DialogContent>
      </Dialog>
      <Dialog
        id={combineIds(id, "delete-speakers-dialog")}
        visible={isDeleteSpeakersDialogVisible}
        onRequestClose={() => setIsDeleteSpeakersDialogVisible(false)}
        aria-labelledby={combineIds(id, "delete-speakers-dialog-title")}
      >
        <DialogHeader>
          <DialogTitle id={combineIds(id, "delete-speakers-dialog-title")}>
            Delete speakers
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <DeleteMediaExcerptSpeakersControl mediaExcerpt={mediaExcerpt} />
        </DialogContent>
        <DialogFooter>
          <SolidButton onClick={() => setIsDeleteSpeakersDialogVisible(false)}>
            Close
          </SolidButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
