import React from "react";
import SingleLineTextField, {
  SingleLineTextProps,
} from "./SingleLineTextField";

interface Props extends Omit<SingleLineTextProps, "type"> {}

export default function EmailTextField(props: Props) {
  return (
    <SingleLineTextField
      autocomplete="email"
      label="Email"
      {...props}
      type="email"
    />
  );
}
