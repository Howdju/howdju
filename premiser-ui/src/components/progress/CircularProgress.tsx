import React from "react";
import {
  CircularProgress as ReactMdCircularProgress,
  CircularProgressProps as ReactMdCircularProgressProps,
} from "@react-md/progress";

export { getProgressA11y } from "@react-md/progress";

interface CircularProgressProps extends ReactMdCircularProgressProps {}

export function CircularProgress(props: CircularProgressProps) {
  return <ReactMdCircularProgress small {...props} />;
}
