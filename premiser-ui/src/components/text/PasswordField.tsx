import React from "react";
import { Password, PasswordProps } from "@react-md/form";
import { FormMessage, FormMessageProps } from "@/components/form/FormMessage";
import { combineIds } from "@/viewModels";
import { MaterialSymbol } from "react-material-symbols";
import { toTextFieldOnChangeCallback } from "@/util";
import { OnPropertyChangeCallback } from "@/types";

interface PasswordFieldProps extends PasswordProps {
  onPropertyChange?: OnPropertyChangeCallback;
  messageProps?: FormMessageProps;
}

export default function PasswordField({
  id,
  onPropertyChange,
  messageProps,
  ...rest
}: PasswordFieldProps) {
  const onChange = toTextFieldOnChangeCallback(onPropertyChange);
  return (
    <>
      <Password
        id={id}
        label="Password"
        leftChildren={<MaterialSymbol icon="password" />}
        onChange={onChange}
        {...rest}
      />
      {messageProps && (
        <FormMessage id={combineIds(id, "message")} {...messageProps} />
      )}
    </>
  );
}
