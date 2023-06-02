import React, { useEffect } from "react";
import { RouteComponentProps } from "react-router";
import { denormalize } from "normalizr";
import {
  CircularProgress,
  Divider,
  DropdownMenu,
  ListItem,
  MenuButton,
} from "react-md";
import { MaterialSymbol } from "react-material-symbols";

import { EntityId } from "howdju-common";

import { useAppDispatch, useAppSelector } from "@/hooks";
import { api } from "@/apiActions";
import { mediaExcerptSchema } from "@/normalizationSchemas";
import { combineIds, MediaExcerptView } from "@/viewModels";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import HowdjuHelmet from "@/Helmet";

interface MatchParams {
  mediaExcerptId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

const id = "media-excerpt-page";

export default function MediaExcerptPage(props: Props) {
  const dispatch = useAppDispatch();
  const { mediaExcerptId } = props.match.params;
  useEffect(() => {
    dispatch(api.fetchMediaExcerpt(mediaExcerptId));
  }, [dispatch, mediaExcerptId]);

  function useInJustification() {}
  function useInAppearance() {}

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
          leftIcon={<MaterialSymbol icon="vertical_align_top" />}
          onClick={useInJustification}
        />,
        <ListItem
          primaryText="Use in Appearance"
          key="use-in-appearance"
          leftIcon={<MaterialSymbol icon="upgrade" />}
          onClick={useInAppearance}
        />,
        <Divider key="divider" />,
        <ListItem
          primaryText="Delete"
          key="delete"
          leftIcon={<MaterialSymbol icon="delete" />}
          onClick={useInJustification}
        />,
      ]}
    />
  );

  const mediaExcerpt = useAppSelector(
    (state) =>
      denormalize(mediaExcerptId, mediaExcerptSchema, state.entities) as
        | MediaExcerptView
        | undefined
  );

  const title = `Media Excerpt ${mediaExcerptId}`;

  if (!mediaExcerpt) {
    return <CircularProgress id={combineIds(id, "progress")} />;
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
    </div>
  );
}
