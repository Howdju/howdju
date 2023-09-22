import React, { useEffect } from "react";
import { CircularProgress } from "react-md";
import { RouteComponentProps } from "react-router";

import { EntityId, makeCreatePropositionInput } from "howdju-common";

import { api } from "@/apiActions";
import HowdjuHelmet from "@/Helmet";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { mediaExcerptSchema } from "@/normalizationSchemas";
import { combineIds } from "@/viewModels";
import { editors } from "@/actions";
import CreateAppearanceEditor from "./CreateAppearanceEditor";

interface MatchParams {
  mediaExcerptId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

const id = "media-excerpt-page";
const editorId = combineIds(id, "editor");

export default function CreateAppearancePage(props: Props) {
  const { mediaExcerptId } = props.match.params;
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(api.fetchMediaExcerpt(mediaExcerptId));
    dispatch(
      editors.beginEdit("APPEARANCE", editorId, {
        mediaExcerptId,
        apparition: {
          type: "PROPOSITION",
          entity: makeCreatePropositionInput(),
        },
      })
    );
  }, [dispatch, mediaExcerptId]);

  const mediaExcerpt = useAppEntitySelector(mediaExcerptId, mediaExcerptSchema);

  const { isFetching } = useAppSelector((state) => state.createAppearancePage);

  if (!mediaExcerpt) {
    if (isFetching) {
      return <CircularProgress id={combineIds(id, "progress")} />;
    }
    return <div>Media Excerpt not found.</div>;
  }

  const title = `Create Appearance in MediaExcerpt ${mediaExcerptId}`;

  return (
    <div className="md-grid">
      <HowdjuHelmet>
        <title>{title} — Howdju</title>
      </HowdjuHelmet>
      <h1 className="md-cell md-cell--12">{title}</h1>
      <p className="md-cell md-cell--12">What appears in this MediaExcerpt?</p>
      <CreateAppearanceEditor
        id={combineIds(id, "editor")}
        editorId={editorId}
        className="md-cell md-cell--12"
        commitBehavior="CommitThenView"
      />
    </div>
  );
}
