import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import { TextField, TextFieldProps } from "@/components/text/TextField";

interface UrlFieldProps extends Omit<TextFieldProps, "type"> {}

/** A TextField with URL-relevant values. */
export default function UrlTextField(props: UrlFieldProps) {
  return (
    <TextField
      leftChildren={<MaterialSymbol icon="link" />}
      {...props}
      type="url"
    />
  );
}
