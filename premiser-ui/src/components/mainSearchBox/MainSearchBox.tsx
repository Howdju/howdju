import React, { FormEvent, useState } from "react"

import ApiAutocomplete from "../../ApiAutocomplete"
import {propositionSchema} from "../../normalizationSchemas"
import {ellipsis} from "../../characters"
import {useAppSelector} from "../../hooks"
import { useDispatch } from "react-redux"
import { api, cancelMainSearchSuggestions } from "../../apiActions"
import { goto } from "../../actions"
import mainSearch from "./mainSearchBoxSlice"
import { Proposition } from "howdju-common"
import { PropertyChanges, SuggestionsKey } from "@/types"


const mainSearchSuggestionsKey = "mainSearch"

/** A component for the main search text box and associated behaviors. */
export default function MainSearch() {
  const searchText = useAppSelector(state => state.mainSearch.text)

  const [isAutocompleteForcedClosed, setIsAutocompleteForcedClosed] = useState(true)
  const dispatch = useDispatch()
  const fetchSuggestions = (...args: any[]) => dispatch(api.fetchMainSearchSuggestions(...args))
  const cancelSuggestions = (suggestionsKey: SuggestionsKey) => dispatch(cancelMainSearchSuggestions(suggestionsKey))

  const dataValue = 'id'
  const dataLabel = 'text'
  const name = "mainSearch"

  const suggestionTransform = (proposition: Proposition) => ({
    [dataValue]: `mainSearchSuggestion-${proposition.id}`,
    [dataLabel]: proposition.text,
  })

  const onPropertChange = (properties: PropertyChanges) => {
    dispatch(mainSearch.textChange(properties[name]))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsAutocompleteForcedClosed(true)
    dispatch(cancelMainSearchSuggestions(mainSearchSuggestionsKey))
    dispatch(goto.mainSearch(searchText))
  }

  const onAutocomplete = (proposition: Proposition) => {
    dispatch(cancelMainSearchSuggestions(mainSearchSuggestionsKey))
    dispatch(goto.proposition(proposition))
  }

  const onKeyDown = () => {
    setIsAutocompleteForcedClosed(false)
  }

  return (
    <form className="md-cell--12 md-cell--top" onSubmit={onSubmit}>
      <ApiAutocomplete
        id="mainSearch"
        type="search"
        name={name}
        placeholder={"know that" + ellipsis}
        dataValue={dataValue}
        dataLabel={dataLabel}
        suggestionSchema={propositionSchema}
        value={searchText}
        onAutocomplete={onAutocomplete}
        suggestionTransform={suggestionTransform}
        onPropertyChange={onPropertChange}
        onKeyDown={onKeyDown}
        fetchSuggestions={fetchSuggestions}
        cancelSuggestions={cancelSuggestions}
        suggestionsKey={mainSearchSuggestionsKey}
        className="mainSearchAutocomplete"
        inputClassName="md-text-field--toolbar"
        escapeClears={true}
        forcedClosed={isAutocompleteForcedClosed}
        singleLine={true}
      />

    </form>
  )
}