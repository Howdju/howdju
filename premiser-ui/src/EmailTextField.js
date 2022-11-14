import React from "react";
import SingleLineTextField from "./SingleLineTextField";

export default class EmailTextField extends React.Component {
  render() {
    return (
      <SingleLineTextField
        autoComplete="email"
        label="Email"
        {...this.props}
        type="email"
      />
    );
  }
}
