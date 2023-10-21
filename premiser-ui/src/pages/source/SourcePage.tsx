import React, { useEffect } from "react";
import { FontIcon } from "@react-md/icon";
import { RouteComponentProps } from "react-router";
import { push } from "connected-react-router";
import { GridCell } from "@react-md/utils";

import { EntityId, logger } from "howdju-common";

import { DropdownMenu, MenuItem } from "@/components/menu/Menu";
import { MenuItemSeparator } from "@/components/menu/Menu";
import { CircularProgress } from "@/components/progress/CircularProgress";
import Helmet from "../../Helmet";
import { api, editors, flows } from "../../actions";
import app from "../../app/appSlice";
import * as characters from "../../characters";
import { mediaExcerptsSchema, sourceSchema } from "../../normalizationSchemas";
import { combineIds, combineSuggestionsKeys } from "../../viewModels";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import SourceEntityCard from "@/components/sources/SourceEntityCard";
import sourcePage from "./sourcePageSlice";
import paths from "@/paths";
import FetchMoreButton from "@/components/button/FetchMoreButton";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import { mediaExcerptCardColSpans } from "@/components/listEntities/ListEntitiesWidget";
import { FlipGrid } from "@/components/layout/FlipGrid";

const id = "source-page";
const editorId = "sourcePageEditorId";

interface MatchParams {
  sourceId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

export default function SourcePage(props: Props) {
  const dispatch = useAppDispatch();
  const sourceId = props.match.params.sourceId;
  useEffect(() => {
    dispatch(sourcePage.clearMediaExcerpts());
    dispatch(api.fetchSource(sourceId));
    dispatch(api.fetchSourceMediaExcerpts(sourceId));
  }, [dispatch, sourceId]);

  const source = useAppEntitySelector(sourceId, sourceSchema);
  const {
    isFetchingSource,
    mediaExcerptIds,
    isFetchingMediaExcerpts,
    mediaExcerptsContinuationToken,
  } = useAppSelector((state) => state.sourcePage);
  const mediaExcerpts = useAppEntitySelector(
    mediaExcerptIds,
    mediaExcerptsSchema
  );

  function editSource() {
    if (!source) {
      logger.error("Cannot edit source because it has not been fetched yet.");
      return;
    }
    dispatch(
      editors.beginEdit("SOURCE", combineIds(editorId, "source"), source)
    );
  }

  function deleteSource() {
    if (!source) {
      logger.error("Cannot delete source because it has not been fetched yet.");
      return;
    }
    dispatch(
      flows.apiActionOnSuccess(
        api.deleteSource(source.id),
        app.addToast("Deleted Source"),
        push(paths.home())
      )
    );
  }

  const sourceName = source?.description ?? characters.ellipsis;
  const title = sourceName;

  const mediaExcerptCards = mediaExcerpts.map((mediaExcerpt) => (
    <MediaExcerptCard
      id={combineIds(id, "media-excerpts", mediaExcerpt.id)}
      key={mediaExcerpt.id}
      mediaExcerpt={mediaExcerpt}
    />
  ));

  function fetchMoreMediaExcerpts() {
    if (!mediaExcerptsContinuationToken) {
      logger.error("No continuation token for media excerpts");
      return;
    }
    dispatch(api.fetchMoreSourceMediaExcerpts(mediaExcerptsContinuationToken));
  }

  // TODO(17): pass props directly after upgrading react-md to a version with correct types
  const menuClassNameProps = { menuClassName: "context-menu" } as any;
  const menu = (
    <DropdownMenu
      icon
      id={combineIds(id, "menu")}
      {...menuClassNameProps}
      children={"more_vert"}
      menuItems={[
        <MenuItem
          primaryText="Edit"
          key="edit"
          leftAddon={<FontIcon>edit</FontIcon>}
          onClick={editSource}
        />,
        <MenuItemSeparator key="divider" />,
        <MenuItem
          primaryText="Delete"
          key="delete"
          leftAddon={<FontIcon>delete</FontIcon>}
          onClick={deleteSource}
        />,
      ]}
    />
  );
  return (
    <div id={id}>
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <h1>Source {source?.id}</h1>
      {isFetchingSource && (
        <CircularProgress id="source-page--source--progress" />
      )}
      {!isFetchingSource && !source && <p>Not found.</p>}
      {source && (
        <SingleColumnGrid>
          <SourceEntityCard
            id={combineIds(id, "source")}
            editorId={combineIds(editorId, "source")}
            source={source}
            menu={menu}
            suggestionsKey={combineSuggestionsKeys(id, "source")}
          />
        </SingleColumnGrid>
      )}

      <h2>Media excerpts</h2>
      {isFetchingMediaExcerpts && (
        <CircularProgress id="source-page--media-excerpts--progress" />
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
        <GridCell key="fetch-more-button" {...mediaExcerptCardColSpans}>
          <FetchMoreButton
            isFetching={isFetchingMediaExcerpts}
            onClick={fetchMoreMediaExcerpts}
          />
        </GridCell>
      </FlipGrid>
    </div>
  );
}
