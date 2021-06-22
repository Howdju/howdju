import React, {Component} from 'react'
import {Checkbox} from 'react-md'

/** Translate Checkbox's onChange to the more convenient onPropertyChange */
export default class HowdjuCheckBox extends Component {

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
      <Checkbox onChange={this.onChange} {...rest}>
        {this.props.children}
      </Checkbox>
    )
  }
}
