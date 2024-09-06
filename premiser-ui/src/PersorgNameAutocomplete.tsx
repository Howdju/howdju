import React from "react";

import { PersorgOut } from "howdju-common";
import {
  api,
  persorgSchema,
  cancelPersorgNameSuggestions,
} from "howdju-client-common";

import ApiAutoComplete, {
  Props as ApiAutoCompleteProps,
} from "./components/autocomplete/ApiAutoComplete";

interface Props
  extends Omit<
    ApiAutoCompleteProps<PersorgOut>,
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
