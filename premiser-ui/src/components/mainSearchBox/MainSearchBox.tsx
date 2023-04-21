import React from "react";
import { useDispatch } from "react-redux";

import { Proposition } from "howdju-common";

import { propositionSchema } from "../../normalizationSchemas";
import { ellipsis } from "../../characters";
import { useAppSelector } from "../../hooks";
import { api, cancelMainSearchSuggestions } from "../../apiActions";
import { goto } from "../../actions";
import mainSearch from "./mainSearchBoxSlice";
import { PropertyChanges } from "@/types";
import ApiAutoComplete from "@/ApiAutoComplete";

import "./MainSearchBox.scss";

const mainSearchSuggestionsKey = "mainSearch";

/** A component for the main search text box and associated behaviors. */
export default function MainSearchBox() {
  const searchText = useAppSelector((state) => state.mainSearch.text);

  const dispatch = useDispatch();

  const dataLabel = "text";
  const name = "mainSearch";

  const onPropertChange = (properties: PropertyChanges) => {
    dispatch(mainSearch.textChange(properties[name]));
  };

  const onSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    dispatch(cancelMainSearchSuggestions(mainSearchSuggestionsKey));
    dispatch(goto.mainSearch(searchText));
  };

  const onAutoComplete = (proposition: Proposition) => {
    dispatch(mainSearch.textChange(""));
    dispatch(cancelMainSearchSuggestions(mainSearchSuggestionsKey));
    dispatch(goto.proposition(proposition));
  };

  return (
    <form
      className="main-search-box-form md-cell--12 md-cell--top"
      onSubmit={onSubmit}
    >
      <ApiAutoComplete
        id="mainSearch"
        name={name}
        placeholder={"know that" + ellipsis}
        labelKey={dataLabel}
        suggestionSchema={propositionSchema}
        value={searchText}
        onAutoComplete={onAutoComplete}
        suggestionsKey={mainSearchSuggestionsKey}
        onPropertyChange={onPropertChange}
        fetchSuggestions={api.fetchMainSearchSuggestions}
        cancelSuggestions={cancelMainSearchSuggestions}
        className="mainSearchAutocomplete"
        areaClassName="md-text-field--toolbar"
        singleLine={true}
        onSubmit={onSubmit}
      />
    </form>
  );
}
