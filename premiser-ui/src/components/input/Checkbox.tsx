import React, { ChangeEvent, ReactNode } from "react";
import {
  Checkbox as ReactMdCheckbox,
  CheckboxProps as ReactMdCheckboxProps,
} from "@react-md/form";
import cn from "classnames";

import { OnPropertyChangeCallback } from "@/types";
import { FormMessage, FormMessageProps } from "@/components/form/FormMessage";
import { combineIds } from "@/viewModels";

export interface CheckboxProps extends ReactMdCheckboxProps {
  children?: ReactNode;
  onPropertyChange: OnPropertyChangeCallback;
  messageProps?: FormMessageProps;
}

/** Translate Checkbox's onChange to the more convenient onPropertyChange */
export function Checkbox({
  id,
  children,
  onPropertyChange,
  messageProps,
  ...rest
}: CheckboxProps) {
  function onChange(event: ChangeEvent<HTMLInputElement>) {
    onPropertyChange({ [event.target.name]: event.target.checked });
  }
  return (
    <div className="howdju-checkbox">
      <ReactMdCheckbox
        id={id}
        onChange={onChange}
        {...rest}
        className={cn({
          "error-message": !!messageProps?.errorMessage,
        })}
      >
        {children}
      </ReactMdCheckbox>
      {messageProps && (
        <FormMessage id={combineIds(`${id}`, "message")} {...messageProps} />
      )}
    </div>
  );
}
