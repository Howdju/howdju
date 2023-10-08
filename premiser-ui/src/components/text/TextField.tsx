import React, { ReactNode } from "react";
import {
  TextField as ReactMdTextField,
  TextFieldProps as ReactMdTextFieldProps,
} from "@react-md/form";

import {
  OnBlurCallback,
  OnPropertyChangeCallback,
  toReactMdOnBlur,
} from "@/types";
import { toTextFieldOnChangeCallback } from "@/util";
import { FormMessage, FormMessageProps } from "@/components/form/FormMessage";
import { combineIds } from "@/viewModels";

export interface TextFieldProps
  extends Omit<ReactMdTextFieldProps, "onBlur" | "onChange" | "maxLength"> {
  children?: ReactNode;
  onPropertyChange?: OnPropertyChangeCallback;
  onBlur?: OnBlurCallback;
  // Zod's maxLength can be null.
  maxLength?: number | null;
  messageProps?: FormMessageProps;
}

export function TextField({
  id,
  value,
  onPropertyChange,
  onBlur,
  maxLength,
  messageProps,
  ...rest
}: TextFieldProps) {
  const onChange = toTextFieldOnChangeCallback(onPropertyChange);
  return (
    <>
      <ReactMdTextField
        id={id}
        {...rest}
        maxLength={maxLength ?? undefined}
        onChange={onChange}
        value={value}
        onBlur={toReactMdOnBlur(onBlur)}
        error={!!messageProps?.errorMessage}
      />
      {messageProps && (
        <FormMessage
          id={combineIds(id, "message")}
          {...messageProps}
          length={value?.length}
          maxLength={maxLength}
        />
      )}
    </>
  );
}
