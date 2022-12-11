import cn from "classnames";
import React from "react";
import {
  SelectionControlGroup as ReactMdSelectionControlGroup,
  SelectionControlGroupProps,
} from "react-md";

import "./SelectionControlGroup.scss";

interface Props extends SelectionControlGroupProps {
  error?: boolean;
  errorText?: string;
}

/** A SelectionControlGroup that displays errors. */
export default function SelectionControlGroup(props: Props) {
  const { error, errorText, ...rest } = props;
  return (
    <div className={cn({ error })}>
      <ReactMdSelectionControlGroup
        error={error ? "error" : undefined}
        {...rest}
      />
      {errorText && <div className="error-message">{errorText}</div>}
    </div>
  );
}
