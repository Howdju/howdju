import React from "react";
import {
  Card as ReactMdCard,
  CardProps as ReactMdCardProps,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardContent as ReactMdCardContent,
  CardContentProps,
} from "@react-md/card";

export {
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardActions,
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
  const headerContents = makeHeaderContents(title, subtitle);
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

export function CardContent({
  // The secondary color is a light gray, and we don't want that as the default card text color.
  disableSecondaryColor = true,
  ...rest
}: CardContentProps) {
  return (
    <ReactMdCardContent
      disableSecondaryColor={disableSecondaryColor}
      {...rest}
    />
  );
}
