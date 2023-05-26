import React from "react";

import { Source, SourceOut } from "howdju-common";

import { api } from "./actions";
import { tagSchema } from "./normalizationSchemas";
import { cancelSourceDescriptionSuggestions } from "./apiActions";
import ApiAutoComplete, {
  Props as ApiAutocompleteProps,
} from "./ApiAutoComplete";

interface Props
  extends Omit<
    ApiAutocompleteProps<SourceOut>,
    "labelKey" | "fetchSuggestions" | "cancelSuggestions" | "suggestionSchema"
  > {}

export default function SourceDescriptionAutocomplete({
  id,
  name,
  suggestionsKey,
  onPropertyChange,
  onAutoComplete,
  ...rest
}: Props) {
  return (
    <ApiAutoComplete
      maxLength={Source.shape.descriptionApa.maxLength}
      label="Description"
      {...rest}
      id={id}
      fetchSuggestions={api.fetchSourceDescriptionSuggestions}
      cancelSuggestions={cancelSourceDescriptionSuggestions}
      suggestionsKey={suggestionsKey}
      suggestionSchema={tagSchema}
      name={name}
      labelKey="name"
      onAutoComplete={onAutoComplete}
      onPropertyChange={onPropertyChange}
    />
  );
}
