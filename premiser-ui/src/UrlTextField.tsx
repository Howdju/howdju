import React, { useState } from "react";
import { FontIcon } from "react-md";

import { schemaSettings } from "howdju-common";

import { isValidUrl, hasValidDomain } from "./util";
import SingleLineTextField, {
  SingleLineTextProps,
} from "./SingleLineTextField";
import { OnPropertyChangeCallback, PropertyChanges } from "./types";

interface Props extends SingleLineTextProps {
  /** If present, the value must pass this predicate for the control to be valid */
  validator?: (val: string) => boolean;
  /** Error text to display when the value is invalid (is an invalid URL or fails the validator) */
  invalidErrorText?: string;
  onPropertyChange: OnPropertyChangeCallback;
}

export default function UrlTextField({
  validator,
  invalidErrorText,
  onPropertyChange,
  value,
  ...rest
}: Props) {
  const [isValid, setIsValid] = useState(true);

  const _onPropertyChange = (properties: PropertyChanges) => {
    checkValid(properties);
    if (onPropertyChange) {
      onPropertyChange(properties);
    }
  };

  const checkValid = (properties: PropertyChanges) => {
    let isValid = true;
    for (const property of Object.keys(properties)) {
      const value = properties[property];
      if (
        value &&
        (!isValidUrl(value) ||
          !hasValidDomain(value) ||
          (validator && !validator(value)))
      ) {
        isValid = false;
        break;
      }
    }
    setIsValid(isValid);
  };

  const props = {
    maxLength: schemaSettings.urlMaxLength,
    ...rest,
    value: value || "",
    onPropertyChange: _onPropertyChange,
    leftIcon: <FontIcon>link</FontIcon>,
  };

  return (
    <SingleLineTextField
      {...props}
      error={!isValid}
      errorText={invalidErrorText || "Must be a valid web address"}
    />
  );
}
