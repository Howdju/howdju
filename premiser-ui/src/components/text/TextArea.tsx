import React, { RefAttributes } from "react";
import {
  TextArea as ReactMdTextArea,
  TextAreaProps as ReactMdTextAreaProps,
} from "@react-md/form";

import { FormMessage, FormMessageProps } from "@/components/form/FormMessage";
import { combineIds } from "@/viewModels";
import { toTextFieldOnChangeCallback } from "@/util";
import { OnPropertyChangeCallback } from "@/types";

export interface TextAreaProps
  extends Omit<ReactMdTextAreaProps, "maxLength" | "onChange">,
    RefAttributes<HTMLTextAreaElement> {
  onPropertyChange?: OnPropertyChangeCallback;
  maxLength?: number | null;
  messageProps?: FormMessageProps;
}

export function TextArea({
  id,
  value,
  onPropertyChange,
  maxLength,
  messageProps,
  ...rest
}: TextAreaProps) {
  const onChange = toTextFieldOnChangeCallback(onPropertyChange);
  return (
    <>
      <ReactMdTextArea
        error={!!messageProps?.errorMessage}
        id={id}
        maxLength={maxLength ?? undefined}
        onChange={onChange}
        value={value}
        {...rest}
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
