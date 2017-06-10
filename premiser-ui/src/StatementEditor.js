import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'
import StatementTextAutocomplete from './StatementTextAutocomplete'
import TextField from "react-md/lib/TextFields";

class StatementEditor extends Component {

  constructor() {
    super()

    this.onChange = this.onChange.bind(this)
  }

  onChange(val, event) {
    const name = event.target.name
    this.props.onPropertyChange({[name]: val})
  }

  render() {
    const {
      statement,
      suggestionsKey,
      name,
      id,
      readOnly,
      onPropertyChange,
      ...rest,
    } = this.props

    const idPrefix = id ? id + '.' : ''
    const namePrefix = name ? name + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    return (suggestionsKey && !readOnly) ?
        <StatementTextAutocomplete id={idPrefix + "text"}
                                   name={namePrefix + "text"}
                                   label="Text"
                                   required
                                   value={statement.text}
                                   suggestionsKey={suggestionsKeyPrefix + 'text'}
                                   onPropertyChange={onPropertyChange}
                                   leftIcon={<FontIcon>text_fields</FontIcon>}
                                   {...rest}
        /> :
        <TextField id={idPrefix + 'text'}
                   name={namePrefix + "text"}
                   label="Text"
                   type="text"
                   value={statement.text}
                   required
                   onChange={this.onChange}
                   leftIcon={<FontIcon>text_fields</FontIcon>}
                   disabled={readOnly}
                   {...rest}
        />
  }
}
StatementEditor.propTypes = {
  statement: PropTypes.object.isRequired,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
}
StatementEditor.defaultProps = {
  readOnly: false
}

export default StatementEditor