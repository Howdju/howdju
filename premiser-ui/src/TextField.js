import React, {Component} from 'react'
import {TextField} from 'react-md'

/** Translate TextField's onChange to the more convenient onPropertyChange */
export default class HowdjuTextField extends Component {

  onChange = (value, event) => {
    if (this.props.onPropertyChange) {
      const target = event.target
      const name = target.name
      this.props.onPropertyChange({[name]: value})
    }
  }

  render() {
    const {
      //ignore
      onPropertyChange,
      ...rest
    } = this.props
    return (
      <TextField onChange={this.onChange} {...rest}>
        {this.props.children}
      </TextField>
    )
  }
}
