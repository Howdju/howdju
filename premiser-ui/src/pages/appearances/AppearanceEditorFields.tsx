import React, { useEffect } from "react";
import { CircularProgress } from "react-md";

import { CreateAppearanceInput, EntityId } from "howdju-common";

import { api } from "@/apiActions";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "@/editors/withEditor";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import { mediaExcerptSchema } from "@/normalizationSchemas";
import PropositionEditorFields from "@/PropositionEditorFields";
import { combineIds } from "@/viewModels";

interface Props
  extends EntityEditorFieldsProps<"appearance", CreateAppearanceInput> {
  editorDispatch: EditorFieldsDispatch;
  mediaExcerptId: EntityId;
}

export default function AppearanceEditorFields({
  id,
  mediaExcerptId,
  disabled,
  suggestionsKey,
  onPropertyChange,
  editorDispatch,
  errors,
  blurredFields,
  dirtyFields,
  wasSubmitAttempted,
}: Props) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(api.fetchMediaExcerpt(mediaExcerptId));
  }, [dispatch, mediaExcerptId]);
  const mediaExcerpt = useAppEntitySelector(mediaExcerptId, mediaExcerptSchema);

  const { isFetching } = useAppSelector((state) => state.createAppearancePage);

  if (!mediaExcerpt) {
    if (isFetching) {
      return <CircularProgress id={combineIds(id, "progress")} />;
    }
    return <div>Media Excerpt not found.</div>;
  }

  return (
    <div>
      <PropositionEditorFields
        id={combineIds(id, "proposition")}
        disabled={disabled}
        suggestionsKey={suggestionsKey}
        onPropertyChange={onPropertyChange}
        editorDispatch={editorDispatch}
        errors={errors}
        blurredFields={blurredFields}
        dirtyFields={dirtyFields}
        wasSubmitAttempted={wasSubmitAttempted}
      />
      <MediaExcerptCard
        id={combineIds(id, "media-excerpt-card")}
        mediaExcerpt={mediaExcerpt}
        className="md-cell md-cell--12"
      />
    </div>
  );
}
