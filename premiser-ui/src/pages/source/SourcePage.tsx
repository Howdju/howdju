import React, { useEffect } from "react";
import { toString } from "lodash";
import {
  Button,
  CircularProgress,
  DropdownMenu,
  FontIcon,
  ListItem,
  MenuButton,
} from "react-md";
import { RouteComponentProps } from "react-router";

import { EntityId, logger } from "howdju-common";

import Helmet from "../../Helmet";
import { api, editors } from "../../actions";
import CellList, { largeCellClasses } from "../../CellList";
import * as characters from "../../characters";
import { mediaExcerptsSchema, sourceSchema } from "../../normalizationSchemas";
import { combineIds, combineSuggestionsKeys } from "../../viewModels";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import SourceEntityCard from "@/components/sources/SourceEntityCard";
import sourcePage from "./sourcePageSlice";

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

  const sourceName = source?.description ?? characters.ellipsis;
  const title = sourceName;

  const mediaExcerptCards = mediaExcerpts.map((mediaExcerpt, index) => (
    <MediaExcerptCard
      id={combineIds(id, "media-excerpts", toString(index))}
      className={largeCellClasses}
      key={index}
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
          onClick={editSource}
        />,
      ]}
    />
  );

  return (
    <div id={id} className="md-grid">
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <h1 className="md-cell md-cell--12">Source {source?.id}</h1>
      {source ? (
        <SourceEntityCard
          id={combineIds(id, "source")}
          editorId={combineIds(editorId, "source")}
          className="md-cell md-cell--12"
          source={source}
          menu={menu}
          suggestionsKey={combineSuggestionsKeys(id, "source")}
        />
      ) : (
        <CircularProgress id="source-page--source--progress" />
      )}

      <h2 className="md-cell md-cell--12">Media excerpts</h2>
      {isFetchingMediaExcerpts && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id="source-page--media-excerpts--progress" />
        </div>
      )}
      {!isFetchingMediaExcerpts && mediaExcerptCards.length === 0 && (
        <div className="md-cell md-cell--12">
          <p>None.</p>
        </div>
      )}
      <CellList className="md-grid md-cell md-cell--12 md-grid--card-list--tablet">
        {mediaExcerptCards}
        <Button raised onClick={fetchMoreMediaExcerpts}>
          More
        </Button>
      </CellList>
    </div>
  );
}
