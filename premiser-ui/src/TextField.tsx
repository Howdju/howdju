import React, { ReactNode } from "react";
import { TextField, TextFieldProps } from "react-md";

import { OnPropertyChangeCallback } from "./types";
import { toTextFieldOnChangeCallback } from "./util";

interface Props extends TextFieldProps {
  children?: ReactNode;
  onPropertyChange?: OnPropertyChangeCallback;
}

/** Translate TextField's onChange to the more convenient onPropertyChange */
export default function HowdjuTextField({
  value,
  children,
  onPropertyChange,
  ...rest
}: Props) {
  const onChange = toTextFieldOnChangeCallback(onPropertyChange);

  return (
    <TextField onChange={onChange} value={value || ""} {...rest}>
      {children}
    </TextField>
  );
}
