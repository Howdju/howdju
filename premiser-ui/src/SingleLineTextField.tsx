import React, { KeyboardEvent, ReactNode } from "react";
import { TextField, TextFieldProps, TextFieldTypes } from "react-md";
import isNull from "lodash/isNull";

import { toSingleLine } from "howdju-common";

import { Keys } from "./keyCodes";
import {
  OnBlurCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  OnSubmitCallback,
  toReactMdOnBlur,
} from "./types";
import { toTextFieldOnChangeCallback } from "./util";

export interface SingleLineTextProps extends Omit<TextFieldProps, "onBlur"> {
  name: string;
  type?: TextFieldTypes;
  // ignored if type=password
  rows?: number;
  // ignored if type=password
  maxRows?: number;
  disabled: boolean;
  onKeyDown?: OnKeyDownCallback;
  onSubmit?: OnSubmitCallback;
  onBlur?: OnBlurCallback;
  onPropertyChange?: OnPropertyChangeCallback;
  value: string | undefined;
  rightControls?: ReactNode;
  // TODO(17) autocomplete should be supported by react-md's TextFieldProps
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete#values
  autocomplete?: string;
  // TODO(17) minLength should be supported by react-md's TextFieldProps
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/minlength
  minLength?: number;
}

export default function SingleLineTextField({
  name,
  type = "text",
  value,
  rows = 1,
  maxRows = 4,
  disabled,
  onBlur,
  // ignore
  onKeyDown,
  onSubmit,
  onPropertyChange,
  rightControls,
  ...rest
}: SingleLineTextProps) {
  const _onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (onKeyDown) {
      onKeyDown(event);
      if (event.defaultPrevented) {
        return;
      }
    }
    if (event.key === Keys.ENTER) {
      // As I recall, react-md (@1, at least) implements all text fields as textareas. This breaks
      // the html text input convention of pressing enter to submit a form.
      //
      // To work around that, we added this component that recreates the behavior.
      //
      // No line breaks in single-line text fields
      event.preventDefault();
      if (onSubmit) {
        onSubmit(event as any);
      }
    }
  };

  const _onChange = toTextFieldOnChangeCallback(onPropertyChange, toSingleLine);

  // password inputs must be <input>, which don't support rows.  If you try it becomes a <textfield> and shows the password!
  const rowProps = type !== "password" ? { rows, maxRows } : {};
  // ``value` prop on `textarea` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.`
  const textareaValue = isNull(value) ? "" : value;
  return (
    <>
      <TextField
        {...rest}
        name={name}
        type={type}
        value={textareaValue}
        {...rowProps}
        disabled={disabled}
        onBlur={toReactMdOnBlur(onBlur)}
        onKeyDown={_onKeyDown}
        onChange={_onChange}
      />
      {rightControls}
    </>
  );
}
