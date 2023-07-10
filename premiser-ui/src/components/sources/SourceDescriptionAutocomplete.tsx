import React from "react";

import { Source, SourceOut } from "howdju-common";

import { api } from "../../actions";
import { sourceSchema } from "../../normalizationSchemas";
import { cancelSourceDescriptionSuggestions } from "../../apiActions";
import ApiAutoComplete, {
  Props as ApiAutocompleteProps,
} from "../../ApiAutoComplete";

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
      maxLength={Source.shape.description.maxLength}
      label="Description"
      {...rest}
      id={id}
      fetchSuggestions={api.fetchSourceDescriptionSuggestions}
      cancelSuggestions={cancelSourceDescriptionSuggestions}
      suggestionsKey={suggestionsKey}
      suggestionSchema={sourceSchema}
      name={name}
      labelKey="description"
      onAutoComplete={onAutoComplete}
      onPropertyChange={onPropertyChange}
    />
  );
}
