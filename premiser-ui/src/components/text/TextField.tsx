import React, { ReactNode } from "react";
import {
  TextField as ReactMdTextField,
  TextFieldProps as ReactMdTextFieldProps,
} from "@react-md/form";

import { OnBlurCallback, OnPropertyChangeCallback } from "@/types";
import { toTextFieldOnChangeCallback } from "@/util";
import { FormMessage, FormMessageProps } from "@/components/form/FormMessage";
import { combineIds } from "@/viewModels";

export interface TextFieldProps
  extends Omit<ReactMdTextFieldProps, "onChange" | "maxLength"> {
  children?: ReactNode;
  onPropertyChange?: OnPropertyChangeCallback;
  onBlur?: OnBlurCallback;
  // Zod's maxLength can be null.
  maxLength?: number | null;
  messageProps?: FormMessageProps;
  rightButtons?: ReactNode;
}

export function TextField({
  id,
  value,
  onPropertyChange,
  maxLength,
  rightButtons,
  messageProps,
  ...rest
}: TextFieldProps) {
  const onChange = toTextFieldOnChangeCallback(onPropertyChange);
  return (
    <>
      <div style={{ display: "flex" }}>
        <ReactMdTextField
          error={!!messageProps?.errorMessage}
          id={id}
          maxLength={maxLength ?? undefined}
          onChange={onChange}
          value={value}
          {...rest}
          style={{
            flexGrow: 1,
          }}
        />
        {rightButtons}
      </div>
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
