import React, { useEffect } from "react";
import { toString } from "lodash";
import { denormalize } from "normalizr";
import { FontIcon } from "@react-md/icon";
import { RouteComponentProps } from "react-router";
import { push } from "connected-react-router";
import { GridCell } from "@react-md/utils";

import { EntityId, MediaExcerptOut, StatementOut } from "howdju-common";

import {
  DropdownMenu,
  MenuItem,
  MenuItemSeparator,
} from "@/components/menu/Menu";
import { CircularProgress } from "@/components/progress/CircularProgress";
import Helmet from "../../Helmet";
import { api, editors, flows } from "../../actions";
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
import { FlipGrid } from "@/components/layout/FlipGrid";
import {
  mediaExcerptCardColSpans,
  statementCardColSpans,
} from "@/components/listEntities/ListEntitiesWidget";

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
      key={index}
      statement={statement}
    />
  ));
  const mediaExcerptCards = mediaExcerpts.map((mediaExcerpt, index) => (
    <MediaExcerptCard
      id={combineIds(id, "media-excerpts", toString(index))}
      key={index}
      mediaExcerpt={mediaExcerpt}
    />
  ));

  const menu = (
    <DropdownMenu
      buttonType="icon"
      id={combineIds(id, "menu")}
      menuClassName="context-menu"
      children={<FontIcon>more_vert</FontIcon>}
      items={[
        <MenuItem
          primaryText="Edit"
          key="edit"
          leftAddon={<FontIcon>edit</FontIcon>}
          onClick={editPersorg}
        />,
        <MenuItemSeparator key="divider" />,
        <MenuItem
          primaryText="Delete"
          key="delete"
          leftAddon={<FontIcon>delete</FontIcon>}
          onClick={deletePersorg}
        />,
      ]}
    />
  );

  return (
    <div>
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <h1>{title}</h1>
      {isFetchingPersorg && (
        <div>
          <CircularProgress id="persorg-page--persorg--progress" />
        </div>
      )}
      {!isFetchingPersorg && !persorg && <p>Not found.</p>}
      {persorg && (
        <PersorgEntityCard
          id={combineIds(id, "persorg")}
          editorId={combineIds(editorId, "persorg")}
          persorg={persorg}
          menu={menu}
          suggestionsKey={combineSuggestionsKeys(id, "persorg")}
        />
      )}

      <h2>Statements</h2>
      {isFetchingStatements && (
        <CircularProgress id="persorg-page--statements--progress" />
      )}
      {!isFetchingStatements && statementCards.length === 0 && (
        <div>
          <p>None.</p>
        </div>
      )}
      <FlipGrid>
        {statementCards.map((card) => (
          <GridCell key={card.key} {...statementCardColSpans}>
            {card}
          </GridCell>
        ))}
      </FlipGrid>

      <h2>Media excerpts</h2>
      {isFetchingMediaExcerpts && (
        <div>
          <CircularProgress id="tagged-propositions-page--progress" />
        </div>
      )}
      {!isFetchingMediaExcerpts && mediaExcerptCards.length === 0 && (
        <div>
          <p>None.</p>
        </div>
      )}
      <FlipGrid>
        {mediaExcerptCards.map((card) => (
          <GridCell key={card.key} {...mediaExcerptCardColSpans}>
            {card}
          </GridCell>
        ))}
      </FlipGrid>
    </div>
  );
}
