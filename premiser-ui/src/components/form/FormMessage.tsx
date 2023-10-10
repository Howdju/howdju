import React, { ReactNode } from "react";
import {
  FormMessage as ReactMdFormMessage,
  FormMessageWithCounterProps as ReactMdFormMessageProps,
} from "@react-md/form";

/**
 * The props required by users of the input containing the FormComponent.
 *
 * The inputs containing this component must provide the ID, probably derived from the
 * input's own ID (so as not to burden users of the input into providing both IDs.)
 *
 * Omit maxLength because both TextField/TextArea and FormMessage accept it, but
 * only one of them needs to. So callers provide maxLength to the input component,
 * which must pass it to the FormMessage it uses.
 */
export interface FormMessageProps extends Omit<FullFormMessageProps, "id"> {}

export interface FullFormMessageProps
  extends Omit<ReactMdFormMessageProps, "length" | "maxLength"> {
  /** The error message to show. If present, it is rendered as an error (default of red.) */
  errorMessage?: ReactNode;
  /** The help message to show. This text is always present and is not rendered as an error even
   * when errorMessage is present. */
  helpMessage?: ReactNode;
  length?: number | null;
  maxLength?: number | null;
}

/** Shows help and error messages for a form input. */
export function FormMessage({
  length,
  maxLength,
  errorMessage,
  helpMessage,
  ...rest
}: FullFormMessageProps) {
  // length and maxLength must be present together
  maxLength = maxLength ?? undefined;
  length = maxLength === undefined || length === null ? undefined : length;
  return (
    <>
      {errorMessage && (
        <ReactMdFormMessage
          length={length}
          maxLength={maxLength}
          {...rest}
          error={!!errorMessage}
        >
          {errorMessage}
        </ReactMdFormMessage>
      )}
      {helpMessage && (
        <ReactMdFormMessage {...rest}>{helpMessage}</ReactMdFormMessage>
      )}
    </>
  );
}
