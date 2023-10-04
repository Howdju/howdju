import React from "react";
import { CircularProgress, getProgressA11y } from "@react-md/progress";
import { TextIconSpacing } from "@react-md/icon";

import { Button, ButtonProps } from "./Button";

import "./FetchButton.scss";

export type FetchButtonProps = ButtonProps & {
  isFetching: boolean;
};

export default function FetchButton(props: FetchButtonProps) {
  const { id, isFetching, children, ...rest } = props;
  const progressId = `${id}-progress`;
  return (
    <Button
      {...rest}
      {...getProgressA11y(progressId, isFetching)}
      theme={isFetching ? "disabled" : "primary"}
      disabled={isFetching}
    >
      <TextIconSpacing
        icon={
          isFetching && <CircularProgress id={progressId} centered={false} />
        }
      >
        {children}
      </TextIconSpacing>
    </Button>
  );
}
