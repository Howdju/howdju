import React, { ReactNode } from "react";
import { TextField as ReactMdTextField, TextFieldProps } from "react-md";

import {
  OnBlurCallback,
  OnPropertyChangeCallback,
  toReactMdOnBlur,
} from "./types";
import { toTextFieldOnChangeCallback } from "./util";

interface Props extends Omit<TextFieldProps, "onBlur" | "onChange"> {
  children?: ReactNode;
  onPropertyChange?: OnPropertyChangeCallback;
  onBlur?: OnBlurCallback;
}

/** A TextField translating more convenient callback's into react-md's versions. */
export default function TextField({
  value,
  children,
  onPropertyChange,
  onBlur,
  ...rest
}: Props) {
  const onChange = toTextFieldOnChangeCallback(onPropertyChange);

  return (
    <ReactMdTextField
      {...rest}
      onChange={onChange}
      value={value || ""}
      onBlur={toReactMdOnBlur(onBlur)}
    >
      {children}
    </ReactMdTextField>
  );
}
