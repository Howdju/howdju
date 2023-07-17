import React, { useEffect } from "react";
import { toString } from "lodash";
import { denormalize } from "normalizr";
import {
  CircularProgress,
  Divider,
  DropdownMenu,
  FontIcon,
  ListItem,
  MenuButton,
} from "react-md";
import { RouteComponentProps } from "react-router";
import { push } from "connected-react-router";

import { EntityId, MediaExcerptOut, StatementOut } from "howdju-common";

import Helmet from "../../Helmet";
import { api, editors, flows } from "../../actions";
import CellList, { largeCellClasses } from "../../CellList";
import * as characters from "../../characters";
import {
  mediaExcerptsSchema,
  persorgSchema,
  statementsSchema,
} from "../../normalizationSchemas";
import { EditorTypes } from "../../reducers/editors";
import PersorgEntityCard from "../../PersorgEntityCard";
import StatementCard from "../../StatementCard";
import { combineIds, combineSuggestionsKeys } from "../../viewModels";
import { useAppDispatch, useAppSelector } from "@/hooks";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import app from "@/app/appSlice";
import paths from "@/paths";

const id = "persorg-page";
const editorId = "persorgPageEditorId";

interface MatchParams {
  persorgId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

export default function PersorgPage(props: Props) {
  const dispatch = useAppDispatch();
  const persorgId = props.match.params.persorgId;
  useEffect(() => {
    dispatch(api.fetchPersorg(persorgId));
    dispatch(api.fetchSpeakerStatements(persorgId));
    dispatch(api.fetchSpeakerMediaExcerpts(persorgId));
  }, [dispatch, persorgId]);

  const entities = useAppSelector((state) => state.entities);
  const persorg = denormalize(persorgId, persorgSchema, entities);
  const {
    isFetchingPersorg,
    statements: statementIds,
    isFetchingStatements,
    mediaExcerpts: mediaExcerptIds,
    isFetchingMediaExcerpts,
  } = useAppSelector((state) => state.persorgPage);
  const statements = denormalize(
    statementIds,
    statementsSchema,
    entities
  ) as StatementOut[];
  const mediaExcerpts = denormalize(
    mediaExcerptIds,
    mediaExcerptsSchema,
    entities
  ) as MediaExcerptOut[];

  const editPersorg = () =>
    dispatch(
      editors.beginEdit(
        EditorTypes.PERSORG,
        combineIds(editorId, "persorg"),
        persorg
      )
    );
  function deletePersorg() {
    dispatch(
      flows.apiActionOnSuccess(
        api.deletePersorg(persorgId),
        app.addToast("Deleted Persorg"),
        push(paths.home())
      )
    );
  }

  const persorgName = persorg?.name
    ? persorg.name
    : isFetchingPersorg
    ? characters.ellipsis
    : undefined;
  const title = `${persorgName ?? "Persorg not found"}`;

  const statementCards = statements.map((statement, index) => (
    <StatementCard
      id={combineIds(id, "statements", toString(index))}
      className={largeCellClasses}
      key={index}
      statement={statement}
    />
  ));
  const mediaExcerptCards = mediaExcerpts.map((mediaExcerpt, index) => (
    <MediaExcerptCard
      id={combineIds(id, "media-excerpts", toString(index))}
      className={largeCellClasses}
      key={index}
      mediaExcerpt={mediaExcerpt}
    />
  ));

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
          primaryText="Edit"
          key="edit"
          leftIcon={<FontIcon>edit</FontIcon>}
          onClick={editPersorg}
        />,
        <Divider key="divider" />,
        <ListItem
          primaryText="Delete"
          key="delete"
          leftIcon={<FontIcon>delete</FontIcon>}
          onClick={deletePersorg}
        />,
      ]}
    />
  );

  return (
    <div id={id} className="md-grid">
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <h1 className="md-cell md-cell--12">{title}</h1>
      {isFetchingPersorg && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id="persorg-page--persorg--progress" />
        </div>
      )}
      {!isFetchingPersorg && !persorg && <p>Not found.</p>}
      {persorg && (
        <PersorgEntityCard
          id={combineIds(id, "persorg")}
          editorId={combineIds(editorId, "persorg")}
          className="md-cell md-cell--12"
          persorg={persorg}
          menu={menu}
          suggestionsKey={combineSuggestionsKeys(id, "persorg")}
        />
      )}

      <h2 className="md-cell md-cell--12">Statements</h2>
      {isFetchingStatements && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id="persorg-page--statements--progress" />
        </div>
      )}
      {!isFetchingStatements && statementCards.length === 0 && (
        <div className="md-cell md-cell--12">
          <p>None.</p>
        </div>
      )}
      <CellList className="md-grid md-cell md-cell--12 md-grid--card-list--tablet">
        {statementCards}
      </CellList>

      <h2 className="md-cell md-cell--12">Media excerpts</h2>
      {isFetchingMediaExcerpts && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id="tagged-propositions-page--progress" />
        </div>
      )}
      {!isFetchingMediaExcerpts && mediaExcerptCards.length === 0 && (
        <div className="md-cell md-cell--12">
          <p>None.</p>
        </div>
      )}
      <CellList className="md-grid md-cell md-cell--12 md-grid--card-list--tablet">
        {mediaExcerptCards}
      </CellList>
    </div>
  );
}
