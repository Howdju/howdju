import React, { useState } from "react";
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
import { Button, DialogContainer } from "react-md";
import { MaterialSymbol } from "react-material-symbols";

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

  const [isMainSearchHelpDialogVisible, setIsMainSearchHelpDialogVisible] =
    useState(false);
  function showMainSearchHelpDialog() {
    setIsMainSearchHelpDialogVisible(true);
  }
  function hideMainSearchHelpDialog() {
    setIsMainSearchHelpDialogVisible(false);
  }

  return (
    <form
      id="main-search-box-form"
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
        rightControls={
          <Button
            className="show-main-search-help-dialog"
            flat
            onClick={showMainSearchHelpDialog}
          >
            <MaterialSymbol icon="help" />
          </Button>
        }
      />
      <DialogContainer
        id="main-search-help-dialog"
        visible={isMainSearchHelpDialogVisible}
        title="Search Help"
        onHide={hideMainSearchHelpDialog}
        className="main-search-help-dialog"
      >
        <p>
          Supported search terms:
          <ul>
            <li>
              Full-text: if you enter regular text, the search will be over
              full-text of all supported entities.
            </li>
            <li>
              URL: will search MediaExcerpts for those associated with the URL.
            </li>
            <li>
              domain: will search MediaExcerpts for those associated with a URL
              ending with the domain.
            </li>
          </ul>
        </p>
        <Button raised primary onClick={hideMainSearchHelpDialog}>
          Close
        </Button>
      </DialogContainer>
    </form>
  );
}
