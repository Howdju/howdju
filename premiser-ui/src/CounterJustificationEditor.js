import React, {Component} from 'react'
import Divider from 'react-md/lib/Dividers'
import TextField from 'react-md/lib/TextFields'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import FontIcon from 'react-md/lib/FontIcons'
import Subheader from 'react-md/lib/Subheaders'
import Button from 'react-md/lib/Buttons'
import {JustificationBasisType, JustificationPolarity} from "./models";
import cn from 'classnames'
import text, {
  JUSTIFICATION_BASIS_TYPE_CITATION_REFERENCE,
  JUSTIFICATION_BASIS_TYPE_STATEMENT, JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE
} from "./texts";

import './JustificationEditor.scss'

class CounterJustificationEditor extends Component {
  constructor() {
    super()
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onPropertyChange(value, event) {
    const target = event.target;
    const name = target.name
    this.props.onPropertyChange({[name]: value})
  }

  onSubmit(e) {
    e.preventDefault()
    this.props.onSubmit()
  }

  render() {
    const {
      counterJustification
    } = this.props

    return (
        <form onSubmit={this.onSubmit}>
          <TextField
              id="basis.entity.text"
              key="basis.entity.text"
              type="text"
              name="basis.entity.text"
              label="Statement"
              value={counterJustification.basis.entity.text}
              onChange={this.onPropertyChange}
              leftIcon={<FontIcon>text_fields</FontIcon>}
          />
        </form>
    )
  }
}

export default CounterJustificationEditor