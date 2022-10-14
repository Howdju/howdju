import throttle from 'lodash/throttle'
import map from 'lodash/map'
import {denormalize} from "normalizr"
import React, {Component} from "react"
import {Autocomplete} from 'react-md'
import { connect } from 'react-redux'

import {
  toSingleLine
} from 'howdju-common'

import autocompleter from './autocompleter'
import {
  ESCAPE_KEY_CODE,
  Keys,
} from './keyCodes'
import {
  autocompletes,
  mapActionCreatorGroupToDispatchToProps
} from "./actions"
import { DebouncedFunc } from 'lodash'
import { OnKeyDownCallback, OnPropertyChangeCallback, OnSubmitCallback, PropertyChanges, SuggestionsKey } from './types'
import { RootState } from './store'

const dataLabel = 'data-label'
const dataValue = 'data-value'

const hasFocus = (el: HTMLInputElement) => window.document.activeElement === el

// TODO(1): remove use of any, conver to functional component?

interface Props {
  name: string
  /** ms to throttle autocomplete refresh by */
  autocompleteThrottle?: number
  /**
   * If the result of suggestionTransform is an object, this property is
   * required and tells the autocomplete which property of the object is the
   * label
   */
  dataLabel: string
  /** Optional name of property to extract from the suggestion to use as a react key */
  dataValue: string
  /** If true, pressing escape when the suggestions are already hidden will clear the field */
  escapeClears?: boolean
  /** A dispatch-wrapped actionCreator to update the suggestions. */
  fetchSuggestions: (value: string, suggestionsKey: SuggestionsKey) => void
  /** A dispatch-wrapped actionCreator to cancel updating the suggestions */
  cancelSuggestions: (suggestionsKey: SuggestionsKey) => void
  /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
  suggestionsKey: string
  /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
  onPropertyChange?: OnPropertyChangeCallback
  /** The callback for when the user selects a suggestion.  Called with the suggested value. */
  onAutocomplete: (suggestion: any) => void
  /** An optional function for transforming the stored suggestions.  Called
   * with item to transform.  Provides flexibility when the results from
   * the API don't match the form required for the Autocomplete
   */
  suggestionTransform?: (suggestion: any) => any
  /** The value to display in the text input */
  value: string
  onKeyDown?: OnKeyDownCallback
  /** If true, will try to keep autocomplete closed */
  forcedClosed?: boolean
  focusInputOnAutocomplete?: boolean
  /** The schema which the component uses to denormalize suggestions */
  suggestionSchema: any
  /** If present, enter will trigger this function */
  onSubmit?: OnSubmitCallback
  /** If true, enforces no line breaks */
  singleLine: boolean
}

interface ConnectProps {
  /** The auto-suggestions. Added by mapStateToProps. Required, but must be
   * optional so that components aren't asked to send it.
   */
  suggestions?: any[]
  transformedSuggestions?: any[]
  // TODO(1): the type should be a bound dispatch method of the autocompletes.
  // But rather than fix, maybe we should be using the useDispatch hook instead.
  autocompletes?: typeof autocompletes
  dispatch?: any // ignore. Only here to prevent passing it as ...rest
}

class ApiAutocomplete extends Component<Props & ConnectProps> {

  public static defaultProps = {
    autocompleteThrottle: 250,
    escapeClears: false,
    singleLine: false,
    focusInputOnAutocomplete: false,
  }

  throttledRefreshAutocomplete: DebouncedFunc<(value: any) => void>
  autocomplete: any

  constructor(props: Props & {autocompletes: any}) {
    super(props)
    this.throttledRefreshAutocomplete = throttle(() => {return})
  }

  componentDidMount() {
    this.throttledRefreshAutocomplete = throttle(
      this.refreshAutocomplete.bind(this), this.props.autocompleteThrottle)
  }

  componentDidUpdate(prevProps: Props) {
    autocompleter.fixOpen(this.autocomplete, this.props.value, this.props.transformedSuggestions)
    if (prevProps.forcedClosed) {
      this.closeAutocomplete()
    }
    if (prevProps.autocompleteThrottle !== this.props.autocompleteThrottle) {
      this.throttledRefreshAutocomplete = throttle(
        this.refreshAutocomplete.bind(this), this.props.autocompleteThrottle)
    }
  }

  onChange = (val: any, event: any) => {
    const name = event.target.name
    if (this.props.singleLine) {
      val = toSingleLine(val)
    }
    this.onPropertyChange({[name]: val})
  }

  onPropertyChange = (properties: PropertyChanges) => {
    if (this.props.onPropertyChange) {
      this.props.onPropertyChange(properties)
    }
    const val = properties[this.props.name]
    if (val) {
      this.throttledRefreshAutocomplete(val)
    } else {
      this.throttledRefreshAutocomplete.cancel()
      this.clearSuggestions()
    }
  }

  onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
      if (event.defaultPrevented) {
        return
      }
    }

    if (event.keyCode === ESCAPE_KEY_CODE) {
      this.throttledRefreshAutocomplete.cancel()
      if (this.isAutocompleteOpen()) {
        event.preventDefault()
        event.stopPropagation()
        this.closeAutocomplete()
        return
      } else if (this.props.value && this.props.escapeClears) {
        event.preventDefault()
        event.stopPropagation()
        this.onPropertyChange({[this.props.name]: ''})
        return
      }
    } else if (event.key === Keys.ENTER) {
      this.closeAutocomplete()
      if (this.props.singleLine) {
        event.preventDefault()
      }
      if (this.props.onSubmit) {
        event.preventDefault()
        this.props.onSubmit(event as any)
      }
    }
  }

  onTouchEnd = () => {
    // Mobile devices need some way to hide the autocomplete, since they lack escape button or the screen space to click around
    // (Sometimes the touchend fires a click and sometimes it doesn't, so handle touch explicitly)
    this.closeAutocomplete()
  }

  onClick = () => {
    // For parity with mobile devices, close the auto complete upon click
    this.closeAutocomplete()
  }

  isAutocompleteOpen = () => {
    return this.autocomplete.state.visible
  }

  closeAutocomplete = () => {
    this.autocomplete._close()
  }

  refreshAutocomplete = (value: string) => {
    this.props.fetchSuggestions(value, this.props.suggestionsKey)
  }

  onAutocomplete = (_label: any, index: number, _transformedSuggestions: any[]) => {
    if (this.props.onAutocomplete) {
      const suggestion = this.props.suggestions?.[index]
      this.props.onAutocomplete(suggestion)
    }
  }

  onMenuOpen = () => {
    // react-md is opening the autocomplete when it doesn't have focus
    if (!hasFocus(this.autocomplete._field)) {
      this.closeAutocomplete()
    }
    if (this.props.forcedClosed) {
      this.closeAutocomplete()
    }
  }

  onBlur = () => {
    this.throttledRefreshAutocomplete.cancel()
    if (this.props.cancelSuggestions) {
      this.props.cancelSuggestions(this.props.suggestionsKey)
    }
    if (this.props.suggestions && this.props.suggestions.length > 0) {
      this.clearSuggestions()
    }
  }

  clearSuggestions = () => {
    this.props.autocompletes?.clearSuggestions(this.props.suggestionsKey)
  }

  setAutocomplete = (autocomplete: any) => this.autocomplete = autocomplete

  render() {
    const {
      value,
      transformedSuggestions,
      focusInputOnAutocomplete,
      // ignore
      autocompletes,
      autocompleteThrottle,
      dispatch,
      escapeClears,
      fetchSuggestions,
      cancelSuggestions,
      suggestions,
      suggestionsKey,
      suggestionTransform,
      onPropertyChange,
      forcedClosed,
      suggestionSchema,
      onSubmit,
      singleLine,
      ...rest
    } = this.props

    return (
      <Autocomplete
        {...rest}
        value={value}
        dataLabel={dataLabel}
        dataValue={dataValue}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
        onAutocomplete={this.onAutocomplete}
        onMenuOpen={this.onMenuOpen}
        onBlur={this.onBlur}
        onTouchEnd={this.onTouchEnd}
        onClick={this.onClick}
        data={transformedSuggestions!}
        filter={null}
        ref={this.setAutocomplete}
        focusInputOnAutocomplete={focusInputOnAutocomplete}
      />
    )
  }
}

// Pluck the properties from the model and give them names appropriate to a DOM element;
// react-md will put all its members as attributes on the element
const defaultSuggestionTransform = (props: any) => (model: any) => ({
  [dataLabel]: model[props.dataLabel],
  [dataValue]: model[props.dataValue],
})

const mapStateToProps = (state: RootState, ownProps: Props) => {
  const normalized = (state.autocompletes.suggestions as any)[ownProps.suggestionsKey]
  const suggestions = denormalize(normalized, [ownProps.suggestionSchema], state.entities) || []
  const transformedSuggestions = ownProps.suggestionTransform ?
    map(suggestions, ownProps.suggestionTransform).map(defaultSuggestionTransform(ownProps)) :
    map(suggestions, defaultSuggestionTransform(ownProps))

  return {
    suggestions,
    transformedSuggestions,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  autocompletes,
}))(ApiAutocomplete as any)
