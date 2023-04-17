import React from "react";

import { Persorg } from "howdju-common";

import { persorgSchema } from "./normalizationSchemas";
import { api, cancelPersorgNameSuggestions } from "./apiActions";
import ApiAutoCompleteV2, {
  Props as ApiAutoCompleteProps,
} from "./ApiAutoCompleteV2";

interface Props
  extends Omit<
    ApiAutoCompleteProps<Persorg>,
    "fetchSuggestions" | "cancelSuggestions" | "suggestionSchema" | "labelKey"
  > {}

export default function PersorgNameAutocomplete(props: Props) {
  return (
    <ApiAutoCompleteV2
      {...props}
      suggestionSchema={persorgSchema}
      fetchSuggestions={api.fetchPersorgNameSuggestions}
      cancelSuggestions={cancelPersorgNameSuggestions}
      labelKey="name"
    />
  );
}
