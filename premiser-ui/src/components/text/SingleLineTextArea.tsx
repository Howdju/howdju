import React, { KeyboardEvent, useRef } from "react";
// import { TextArea, TextAreaProps } from "@react-md/form";
import { TextArea, TextAreaProps } from "./TextArea";
import isNull from "lodash/isNull";

import { toSingleLine } from "howdju-common";

import { FormMessage, FormMessageProps } from "@/components/form/FormMessage";
import { Keys } from "@/keyCodes";
import {
  OnBlurCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  PropertyChanges,
  toReactMdOnBlur,
} from "@/types";
import { combineIds } from "@/viewModels";
import { mapValues } from "lodash";

export interface SingleLineTextAreaProps
  extends Omit<TextAreaProps, "onBlur" | "maxLength"> {
  /** The name of the input. If omitted, the input's onPropertyChange will not provide a name and
   * the input should probably be read-only. */
  name?: string;
  rows?: number;
  maxRows?: number;
  disabled?: boolean;
  onKeyDown?: OnKeyDownCallback;
  onBlur?: OnBlurCallback;
  onPropertyChange?: OnPropertyChangeCallback;
  value?: string;
  maxLength?: number | null;
  messageProps?: FormMessageProps;
  rightControls?: React.ReactNode;
}

/**
 * A textarea that restricts its input to a single paragraph. The intention is to have
 * an input that behaves in most ways like a regular <input type="text"> except
 * that instead of truncating text when it gets longer than the input's width
 * can support, it increases the height of the input to where it can display
 * the entire text wrapped.
 *
 * To get this behavior, this component must intercept enter key presses and
 * prevent them from inserting newlines. Instead, the component tries to call
 * its form's requestSubmit method.
 *
 * The field optionally accepts minRows and maxRows to constrain the dynamic height.
 */
export default function SingleLineTextArea({
  id,
  name,
  value,
  rows = 1,
  maxRows = 4,
  disabled = false,
  onBlur,
  onKeyDown,
  onPropertyChange,
  maxLength,
  messageProps,
  rightControls,
  ...rest
}: SingleLineTextAreaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const _onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (onKeyDown) {
      onKeyDown(event);
      if (event.defaultPrevented) {
        return;
      }
    }
    if (event.key === Keys.ENTER) {
      // No line breaks in single-line text fields
      event.preventDefault();
      ref.current?.form?.requestSubmit();
    }
  };

  function _onPropertyChange(change: PropertyChanges) {
    if (!onPropertyChange) {
      return;
    }
    onPropertyChange(mapValues(change, toSingleLine));
  }

  // ``value` prop on `textarea` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.`
  const textareaValue = isNull(value) ? "" : value;
  return (
    <>
      <TextArea
        id={id}
        {...rest}
        name={name}
        value={textareaValue}
        rows={rows}
        maxRows={maxRows}
        disabled={disabled}
        maxLength={maxLength ?? undefined}
        onBlur={toReactMdOnBlur(onBlur)}
        onKeyDown={_onKeyDown}
        onPropertyChange={_onPropertyChange}
        ref={(ta: HTMLTextAreaElement) => {
          ref.current = ta;
        }}
        error={!!messageProps?.errorMessage}
      />
      {rightControls}
      {messageProps && (
        <FormMessage id={combineIds(id, "message")} {...messageProps} />
      )}
    </>
  );
}
