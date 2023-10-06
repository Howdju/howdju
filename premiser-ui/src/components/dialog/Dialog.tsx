import React from "react";
import { isArray } from "lodash";
import {
  Dialog as ReactMdDialog,
  DialogProps as ReactMdDialogProps,
  DialogHeader,
  DialogTitle,
} from "@react-md/dialog";
import { RequireAtLeastOne } from "type-fest";

export {
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@react-md/dialog";
export type {
  DialogHeaderProps,
  DialogTitleProps,
  DialogContentProps,
  DialogFooterProps,
} from "@react-md/dialog";

export type DialogProps = RequireAtLeastOne<
  ReactMdDialogProps & {
    title?: string;
  },
  "aria-labelledby" | "aria-label" | "title"
>;

/** A Dialog providing shorthand for adding title elements. */
export function Dialog({
  title,
  children,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: DialogProps) {
  const newChildren = isArray(children) ? [...children] : [children];

  if (title) {
    const headerId = `${rest.id}--header`;
    const titleId = `${rest.id}--title`;
    newChildren.unshift(
      <DialogHeader key={headerId}>
        <DialogTitle id={titleId}>{title}</DialogTitle>
      </DialogHeader>
    );
    ariaLabelledBy = titleId;
  }

  return (
    <ReactMdDialog {...rest} aria-labelledby={ariaLabelledBy as string}>
      {newChildren}
    </ReactMdDialog>
  );
}
