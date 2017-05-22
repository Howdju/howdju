import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'
import StatementTextAutocomplete from './StatementTextAutocomplete'

class StatementEditor extends Component {

  constructor() {
    super()

    this.onTextAutocomplete = this.onTextAutocomplete.bind(this)
  }

  onTextAutocomplete(text, index) {
    this.props.onPropertyChange({text})
  }

  render() {
    const {
      statement,
      suggestionsKey,
      statementTextInputId,
    } = this.props

    return (
        <div>
          <StatementTextAutocomplete id={statementTextInputId}
                                     name="text"
                                     label="Text"
                                     required
                                     leftIcon={<FontIcon>text_fields</FontIcon>}
                                     value={statement.text}
                                     suggestionsKey={suggestionsKey}
                                     onChange={this.props.onPropertyChange}
                                     onAutocomplete={this.onTextAutocomplete}
          />
        </div>
    )
  }
}
StatementEditor.propTypes = {
  statement: PropTypes.object.isRequired,
  statementTextInputId: PropTypes.string.isRequired,
  suggestionsKey: PropTypes.string.isRequired,
  onPropertyChange: PropTypes.func.isRequired,
}

export default StatementEditor