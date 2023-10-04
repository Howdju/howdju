import React from "react";

import FetchButton, { FetchButtonProps } from "./FetchButton";

export type FetchMoreButtonProps = FetchButtonProps & { children?: never };

export default function FetchMoreButton(props: FetchMoreButtonProps) {
  return <FetchButton {...props}>Fetch more</FetchButton>;
}
