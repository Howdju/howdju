import React, { useEffect } from "react";
import { RouteComponentProps } from "react-router";

import { EntityId, makeCreatePropositionInput } from "howdju-common";
import { api, mediaExcerptSchema } from "howdju-client-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import HowdjuHelmet from "@/Helmet";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { combineIds } from "@/viewModels";
import { editors } from "@/actions";
import CreateAppearanceEditor from "./CreateAppearanceEditor";
import { Page } from "@/components/layout/Page";

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
    <Page>
      <HowdjuHelmet>
        <title>{title} — Howdju</title>
      </HowdjuHelmet>
      <h1>{title}</h1>
      <p>What appears in this MediaExcerpt?</p>
      <CreateAppearanceEditor
        id={combineIds(id, "editor")}
        editorId={editorId}
        commitBehavior="CommitThenView"
      />
    </Page>
  );
}
