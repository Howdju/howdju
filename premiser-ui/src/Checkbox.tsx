import React, { ReactNode } from "react";
import {
  Checkbox as ReactMdCheckbox,
  CheckboxProps as ReactMdCheckboxProps,
} from "react-md";

import { OnPropertyChangeCallback } from "./types";
import { toCheckboxOnChangeCallback } from "./util";

export interface CheckboxProps extends ReactMdCheckboxProps {
  children?: ReactNode;
  onPropertyChange: OnPropertyChangeCallback;
}

/** Translate Checkbox's onChange to the more convenient onPropertyChange */
export default function Checkbox({
  children,
  onPropertyChange,
  ...rest
}: CheckboxProps) {
  return (
    <ReactMdCheckbox
      onChange={toCheckboxOnChangeCallback(onPropertyChange)}
      {...rest}
    >
      {children}
    </ReactMdCheckbox>
  );
}
