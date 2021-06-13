import React from 'react'
import SingleLineTextField from './SingleLineTextField'

export default class EmailTextField extends React.Component {
  render() {
    return (
      <SingleLineTextField
        autocomplete="email"
        label="Email"
        {...this.props}
        type="email"
      />
    )
  }
}
