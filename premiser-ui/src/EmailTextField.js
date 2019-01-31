import React from 'react'
import SingleLineTextField from './SingleLineTextField'

export default class EmailTextField extends React.Component {
  render() {
    return (
      <SingleLineTextField
        {...this.props}
        type="email"
        label="Email"
      />
    )
  }
}
