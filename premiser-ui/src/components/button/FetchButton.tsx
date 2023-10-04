import React from "react";
import { CircularProgress, getProgressA11y } from "@react-md/progress";

import { Button, ButtonProps } from "./Button";

import "./FetchButton.scss";

export type FetchButtonProps = ButtonProps & {
  isFetching: boolean;
};

export default function FetchButton(props: FetchButtonProps) {
  const { id, isFetching, children, ...rest } = props;
  const progressId = `${id}-progress`;
  const fetchingContent = (
    <div>
      {children}
      <CircularProgress key={progressId} id={progressId} />
    </div>
  );
  const content = isFetching ? fetchingContent : children;
  return (
    <Button
      {...rest}
      {...getProgressA11y(progressId, isFetching)}
      theme={isFetching ? "disabled" : "primary"}
      disabled={isFetching}
    >
      {isFetching && <CircularProgress id={progressId} centered={false} />}
      {content}
    </Button>
  );
}
