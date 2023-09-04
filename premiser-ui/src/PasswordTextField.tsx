import React from "react";
import SingleLineTextField, {
  SingleLineTextProps,
} from "./SingleLineTextField";

interface Props extends Omit<SingleLineTextProps, "type"> {}

export default function PasswordTextField(props: Props) {
  return <SingleLineTextField label="Password" {...props} type="password" />;
}
