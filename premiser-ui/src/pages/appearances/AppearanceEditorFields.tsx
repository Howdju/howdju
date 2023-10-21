import React from "react";

import { CreateAppearanceInput } from "howdju-common";

import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { useAppEntitySelector } from "@/hooks";
import { mediaExcerptSchema } from "@/normalizationSchemas";
import PropositionEditorFields from "@/PropositionEditorFields";
import { combineIds } from "@/viewModels";

interface Props
  extends EntityEditorFieldsProps<"appearance", CreateAppearanceInput> {}

export default function AppearanceEditorFields({
  id,
  appearance,
  disabled,
  suggestionsKey,
  onPropertyChange,
  editorDispatch,
  errors,
  blurredFields,
  dirtyFields,
  wasSubmitAttempted,
}: Props) {
  const { mediaExcerptId } = appearance;
  const mediaExcerpt = useAppEntitySelector(mediaExcerptId, mediaExcerptSchema);

  if (!mediaExcerpt) {
    return <div>Media Excerpt not found.</div>;
  }

  return (
    <div>
      <fieldset>
        <legend>Proposition</legend>
        <PropositionEditorFields
          id={combineIds(id, "proposition")}
          name="apparition.entity"
          disabled={disabled}
          proposition={appearance.apparition.entity}
          suggestionsKey={suggestionsKey}
          onPropertyChange={onPropertyChange}
          editorDispatch={editorDispatch}
          errors={errors}
          blurredFields={blurredFields}
          dirtyFields={dirtyFields}
          wasSubmitAttempted={wasSubmitAttempted}
        />
      </fieldset>
      <MediaExcerptCard
        id={combineIds(id, "media-excerpt-card")}
        mediaExcerpt={mediaExcerpt}
        style={{ width: "100%" }}
      />
    </div>
  );
}
