import React, {Component} from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import has from 'lodash/has'
import {
  Button,
  Switch,
} from 'react-md'

import {schemas} from 'howdju-common'

import SingleLineTextField from "./SingleLineTextField"
import EntityAutocomplete from './EntityAutocomplete'
import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from "./ErrorMessages"
import {
  combineIds,
  combineNames,
  combineSuggestionsKeys,
} from './viewModels'
import {api, mapActionCreatorGroupToDispatchToProps} from './actions'
import UrlTextField from './UrlTextField'
import {
  isTwitterUrl,
  isWikipediaUrl
} from './util'


const nameControlName = 'name'

class PersorgEditorFields extends Component {

  static propTypes = {
    persorg: PropTypes.object,
    id: PropTypes.string.isRequired,
    /** An optional override of the ID of the input for editing the Persorg name.  If absent, an ID will be auto generated based upon {@see id} */
    nameId: PropTypes.string,
    /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
    controlName: PropTypes.string,
    /** If omitted, no autocomplete */
    suggestionsKey: PropTypes.string,
    onPropertyChange: PropTypes.func.isRequired,
    errors: PropTypes.object,
    disabled: PropTypes.bool,
    onKeyDown: PropTypes.func,
    /** If present, overrides the default label for the proposition text input */
    nameLabel: PropTypes.string,
  }

  static defaultProps = {
    disabled: false,
    nameLabel: 'Name',
  }

  state = {
    showUrls: false
  }

  onChange = (value, event) => {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  onShowUrlsClick = () => {
    this.setState({
      showUrls: !this.state.showUrls
    })
  }

  render() {
    const {
      id,
      nameId,
      persorg,
      suggestionsKey,
      controlName,
      nameLabel,
      disabled,
      onPropertyChange,
      errors,
      onKeyDown,
      onSubmit,
      ...rest,
    } = this.props
    const {
      showUrls
    } = this.state

    const modelErrors = errors && errors.modelErrors
    const nameErrorProps = errors && errors.hasErrors && errors.fieldErrors.name.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.name)} :
      null

    const hasName = has(persorg, nameControlName)
    const name = get(persorg, nameControlName, '')

    const nameInputProps = {
      id: nameId || combineIds(id, 'name'),
      name: combineNames(controlName, nameControlName),
      label: nameLabel,
      maxLength: schemas.persorgNameMaxLength,
      value: name,
      required: true,
      onKeyDown,
      onSubmit,
      onPropertyChange,
      disabled: disabled || !hasName
    }

    const nameInput = (suggestionsKey && !disabled) ?
      <EntityAutocomplete
        {...rest}
        {...nameErrorProps}
        {...nameInputProps}
        suggestionFetcher={api.fetchPersorgNameSuggestions}
        suggestionFetchCanceler={api.cancelPersorgNameSuggestions}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, nameControlName)}
      /> :
      <SingleLineTextField
        {...rest}
        {...nameErrorProps}
        {...nameInputProps}
      />
    return (
      <div>
        <ErrorMessages errors={modelErrors}/>
        {nameInput}
        <Switch
          id={combineIds(id, 'is-organization')}
          name={combineNames(controlName, 'isOrganization')}
          checked={persorg.isOrganization}
          label="Is Organization?"
          disabled={disabled}
          onChange={this.onChange}
        />
        {!persorg.isOrganization && (
          <SingleLineTextField
            id={combineIds(id, 'known-for')}
            name={combineNames(controlName, 'knownFor')}
            label="Known for"
            value={persorg.knownFor}
            helpText="What is this person known for?  (Helps disambiguate people with the same name.)"
            disabled={disabled}
            onPropertyChange={onPropertyChange}
            onSubmit={onSubmit}
          />
        )}
        <Button
          flat
          onClick={this.onShowUrlsClick}
        >
          {showUrls ? "Hide URLs" : "Show URLs"}
        </Button>
        {showUrls && ([
          <UrlTextField
            key="website"
            id={combineIds(id, 'website-url')}
            name={combineNames(controlName, 'websiteUrl')}
            label="Website"
            value={persorg.websiteUrl}
            disabled={disabled}
            onPropertyChange={onPropertyChange}
            onSubmit={onSubmit}
          />,
          <UrlTextField
            key="wikipedia"
            id={combineIds(id, 'wikipedia-url')}
            name={combineNames(controlName, 'wikipediaUrl')}
            label="Wikipedia"
            value={persorg.wikipediaUrl}
            validator={isWikipediaUrl}
            invalidErrorText="Must be a wikipedia.org address"
            disabled={disabled}
            onPropertyChange={onPropertyChange}
            onSubmit={onSubmit}
          />,
          <UrlTextField
            key="twitter"
            id={combineIds(id, 'twitter-url')}
            name={combineNames(controlName, 'twitterUrl')}
            label="Twitter"
            value={persorg.twitterUrl}
            validator={isTwitterUrl}
            invalidErrorText="Must be a twitter.com address"
            disabled={disabled}
            onPropertyChange={onPropertyChange}
            onSubmit={onSubmit}
          />
        ])}
      </div>
    )
  }
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  api,
}))(PersorgEditorFields)
