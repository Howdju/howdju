import React, {Component} from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import has from 'lodash/has'
import {
  Button,
  Switch,
} from 'react-md'

import {schemaSettings} from 'howdju-common'

import {api, mapActionCreatorGroupToDispatchToProps} from './actions'
import PersorgNameAutocomplete from './PersorgNameAutocomplete'
import ErrorMessages from "./ErrorMessages"
import {toErrorText} from "./modelErrorMessages"
import SingleLineTextField from "./SingleLineTextField"
import {
  combineIds,
  combineNames,
  combineSuggestionsKeys,
} from './viewModels'
import UrlTextField from './UrlTextField'
import {
  isTwitterUrl,
  isWikipediaUrl
} from './util'


const nameName = 'name'

class PersorgEditorFields extends Component {

  static propTypes = {
    persorg: PropTypes.object,
    id: PropTypes.string.isRequired,
    /** An optional override of the ID of the input for editing the Persorg name.  If absent, an ID will be auto generated based upon {@see id} */
    nameId: PropTypes.string,
    /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
    name: PropTypes.string,
    /** If omitted, no autocomplete */
    suggestionsKey: PropTypes.string,
    /** Will be called with the persorg upon an autocomplete */
    onPersorgNameAutocomplete: PropTypes.func,
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

  onPersorgNameAutocomplete = (persorg) => {
    if (this.props.onPersorgNameAutocomplete) {
      this.props.onPersorgNameAutocomplete(persorg)
    }
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
      name,
      nameLabel,
      disabled,
      onPropertyChange,
      errors,
      onKeyDown,
      onSubmit,
      // ignore
      onPersorgNameAutocomplete,
      ...rest
    } = this.props
    const {
      showUrls
    } = this.state

    const modelErrors = errors && errors.modelErrors
    const nameErrorProps = errors && errors.hasErrors && errors.fieldErrors.name.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.name)} :
      null

    const hasName = has(persorg, nameName)
    const persorgName = get(persorg, nameName, '')

    const nameInputProps = {
      id: nameId || combineIds(id, nameName),
      name: combineNames(name, nameName),
      label: nameLabel,
      maxLength: schemaSettings.persorgNameMaxLength,
      value: persorgName,
      required: true,
      onKeyDown,
      onSubmit,
      onPropertyChange,
      disabled: disabled || !hasName
    }

    const nameInput = (suggestionsKey && !disabled) ?
      <PersorgNameAutocomplete
        {...rest}
        {...nameErrorProps}
        {...nameInputProps}
        onAutocomplete={this.onPersorgNameAutocomplete}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, nameName)}
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
          name={combineNames(name, 'isOrganization')}
          checked={persorg.isOrganization}
          label="Is Organization?"
          disabled={disabled}
          onChange={this.onChange}
        />
        {!persorg.isOrganization && (
          <SingleLineTextField
            id={combineIds(id, 'known-for')}
            name={combineNames(name, 'knownFor')}
            label="Known for"
            value={persorg.knownFor}
            helpText="What is this person or organization known for?  (Helps disambiguate people with the same name or for obscure organizations with a better known purpose.)"
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
            name={combineNames(name, 'websiteUrl')}
            label="Website"
            value={persorg.websiteUrl}
            disabled={disabled}
            onPropertyChange={onPropertyChange}
            onSubmit={onSubmit}
          />,
          <UrlTextField
            key="wikipedia"
            id={combineIds(id, 'wikipedia-url')}
            name={combineNames(name, 'wikipediaUrl')}
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
            name={combineNames(name, 'twitterUrl')}
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
