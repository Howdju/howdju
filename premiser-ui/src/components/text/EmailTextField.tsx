import React from "react";

import { TextField, TextFieldProps } from "@/components/text/TextField";
import { MaterialSymbol } from "react-material-symbols";

interface EmailFieldProps extends Omit<TextFieldProps, "type"> {}

/** A TextField with email-relevant values. */
export default function EmailField(props: EmailFieldProps) {
  return (
    <TextField
      autoComplete="email"
      label="Email"
      leftChildren={<MaterialSymbol icon="alternate_email" />}
      {...props}
      type="email"
    />
  );
}
