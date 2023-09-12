import React, { ReactNode } from "react";
import { CircularProgress, Button, ButtonProps } from "react-md";

import "./FetchButton.scss";

type Props = Partial<ButtonProps> & {
  /** The ID of the progress indicator.  Required for accessibility. */
  progressId: string;
  isFetching: boolean;
  label: ReactNode;
};

export default function FetchButton(props: Props) {
  const { isFetching, label, progressId, ...rest } = props;
  const fetchingLabel = (
    <div>
      {label}
      <CircularProgress key={progressId} id={progressId} />
    </div>
  );
  const buttonLabel = isFetching ? fetchingLabel : label;
  return <Button {...rest} children={buttonLabel} />;
}
