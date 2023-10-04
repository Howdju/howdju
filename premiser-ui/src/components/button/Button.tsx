import React from "react";
import {
  Button as ReactMdButton,
  ButtonProps as ReactMdButtonProps,
} from "@react-md/button";
import { push } from "connected-react-router";

import { useAppDispatch } from "@/hooks";

export type ButtonProps =
  | (ReactMdButtonProps & {
      href?: never;
    })
  | (ReactMdButtonProps & {
      onClick?: never;
      href: string;
    });

/** A button that navigates to a href on click, if provided. */
export function Button(props: ButtonProps) {
  const dispatch = useAppDispatch();
  if ("href" in props && props.href) {
    if ("onClick" in props) {
      throw new Error(
        "Button cannot have both href and onClick props. Use one or the other."
      );
    }
    const onClick = () => dispatch(push(props.href));
    return <ReactMdButton {...props} onClick={onClick} />;
  }

  return <ReactMdButton {...props} />;
}
