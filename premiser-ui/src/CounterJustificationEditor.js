import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'

import StatementTextAutocomplete from './StatementTextAutocomplete'
import { suggestionKeys } from './autocompleter'

import './JustificationEditor.scss'

class CounterJustificationEditor extends Component {
  constructor() {
    super()
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onStatementTextAutocomplete = this.onStatementTextAutocomplete.bind(this)
  }

  onPropertyChange(change) {
    this.props.onPropertyChange(change)
  }

  onStatementTextAutocomplete(text, index) {
    this.props.onPropertyChange({'basis.entity.text': text})
  }

  onSubmit(e) {
    e.preventDefault()
    this.props.onSubmit()
  }

  render() {
    const {
      counterJustification
    } = this.props

    const targetJustificationId = counterJustification.target.entity.id

    return (
        <form onSubmit={this.onSubmit}>
          <StatementTextAutocomplete
              id="basis.entity.text"
              key="basis.entity.text"
              name="basis.entity.text"
              label="Statement"
              required
              leftIcon={<FontIcon>text_fields</FontIcon>}
              value={counterJustification.basis.entity.text}
              suggestionsKey={suggestionKeys.counterJustificationEditor(targetJustificationId)}
              onPropertyChange={this.onPropertyChange}
              onAutocomplete={this.onStatementTextAutocomplete}
          />
        </form>
    )
  }
}
CounterJustificationEditor.propTypes = {
  counterJustification: PropTypes.object,
  onPropertyChange: PropTypes.func,
  onSubmit: PropTypes.func,
}

export default CounterJustificationEditor