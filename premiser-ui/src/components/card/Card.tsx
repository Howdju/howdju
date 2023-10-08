import React from "react";
import { isArray } from "lodash";
import {
  Card as ReactMdCard,
  CardProps as ReactMdCardProps,
  CardHeader,
  CardTitle,
  CardSubtitle,
} from "@react-md/card";

export {
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardActions,
  CardContent,
} from "@react-md/card";
export type {
  CardHeaderProps,
  CardTitleProps,
  CardSubtitleProps,
  CardActionsProps,
  CardContentProps,
} from "@react-md/card";

export interface CardProps extends ReactMdCardProps {
  title?: string;
  subtitle?: false | string;
}

/** A Card providing shorthands for title and subtitle. */
export function Card({ children, title, subtitle, ...rest }: CardProps) {
  const newChildren = isArray(children) ? [...children] : [children];

  const headerContents = makeHeaderContents(title, subtitle);
  if (title || subtitle) {
    const headerChildren = [];
    if (title) {
      headerChildren.push();
    }
    if (subtitle) {
      headerChildren.push(<CardSubtitle>{subtitle}</CardSubtitle>);
    }
    newChildren.unshift();
  }

  return (
    <ReactMdCard {...rest}>
      {headerContents && <CardHeader>{headerContents}</CardHeader>}
      {children}
    </ReactMdCard>
  );
}

function makeHeaderContents(title?: string, subtitle?: false | string) {
  if (title && subtitle) {
    return (
      <>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </>
    );
  }
  if (title) {
    return <CardTitle>{title}</CardTitle>;
  }
  if (subtitle) {
    return <CardSubtitle>{subtitle}</CardSubtitle>;
  }
  return undefined;
}
