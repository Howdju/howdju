import React from 'react'
import SingleLineTextField from './SingleLineTextField'

export default class PasswordTextField extends React.Component {
  render() {
    return (
      <SingleLineTextField
        {...this.props}
        type="password"
        label="Password"
      />
    )
  }
}
