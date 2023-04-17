import React from "react";

import { Persorg } from "howdju-common";

import { persorgSchema } from "./normalizationSchemas";
import { api, cancelPersorgNameSuggestions } from "./apiActions";
import ApiAutoComplete, {
  Props as ApiAutoCompleteProps,
} from "./ApiAutoComplete";

interface Props
  extends Omit<
    ApiAutoCompleteProps<Persorg>,
    "fetchSuggestions" | "cancelSuggestions" | "suggestionSchema" | "labelKey"
  > {}

export default function PersorgNameAutocomplete(props: Props) {
  return (
    <ApiAutoComplete
      {...props}
      suggestionSchema={persorgSchema}
      fetchSuggestions={api.fetchPersorgNameSuggestions}
      cancelSuggestions={cancelPersorgNameSuggestions}
      labelKey="name"
    />
  );
}
