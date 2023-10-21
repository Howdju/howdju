import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { MaterialSymbol } from "react-material-symbols";

import { PropositionOut } from "howdju-common";

import { propositionSchema } from "../../normalizationSchemas";
import { ellipsis } from "../../characters";
import { useAppSelector } from "../../hooks";
import { api, cancelMainSearchSuggestions } from "../../apiActions";
import { goto } from "../../actions";
import mainSearch from "./mainSearchBoxSlice";
import { PropertyChanges } from "@/types";
import ApiAutoComplete from "@/components/autocomplete/ApiAutoComplete";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/dialog/Dialog";
import IconButton from "../button/IconButton";
import SolidButton from "../button/SolidButton";

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

  const onAutoComplete = (proposition: PropositionOut) => {
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
      className="main-search-box-form"
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
          <IconButton onClick={showMainSearchHelpDialog}>
            <MaterialSymbol icon="help" />
          </IconButton>
        }
      />
      <Dialog
        id="main-search--help-dialog"
        onRequestClose={hideMainSearchHelpDialog}
        visible={isMainSearchHelpDialogVisible}
        title="Search Help"
      >
        <DialogContent>
          <p>Supported search terms:</p>
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
        </DialogContent>
        <DialogFooter>
          <SolidButton onClick={hideMainSearchHelpDialog}>Close</SolidButton>
        </DialogFooter>
      </Dialog>
    </form>
  );
}
