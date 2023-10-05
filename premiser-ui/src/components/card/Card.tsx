import React, { FunctionComponent, ReactElement } from "react";
import { isArray, isString } from "lodash";
import {
  Card as ReactMdCard,
  CardProps as ReactMdCardProps,
  CardHeader as ReactMdCardHeader,
  CardHeaderProps as ReactMdCardHeaderProps,
  CardTitle as ReactMdCardTitle,
  CardTitleProps as ReactMdCardTitleProps,
  CardSubtitle as ReactMdCardSubtitle,
  CardSubtitleProps as ReactMdCardSubtitleProps,
  CardActions as ReactMdCardActions,
  CardActionsProps as ReactMdCardActionsProps,
  CardContent as ReactMdCardContent,
  CardContentProps as ReactMdCardContentProps,
} from "@react-md/card";

type CardElementChild = ReactElement<
  CardHeaderProps | CardContentProps | CardActionsProps
>;
type CardChild = CardElementChild | false | null;
type CardHeaderElementChild = ReactElement<CardTitleProps | CardSubtitleProps>;
type CardHeaderChild = CardHeaderElementChild | false | null;

export interface CardProps extends ReactMdCardProps {
  title?: string;
  subtitle?: false | string;
  children: CardChild | CardChild[];
}

/** A Card providing shorthands for title and subtitle. */
export function Card({ children, title, subtitle, ...rest }: CardProps) {
  const reactMdChildren = [];
  const invalidChildren = [];

  if (title || subtitle) {
    const headerChildren = [];
    if (title) {
      headerChildren.push(<ReactMdCardTitle>{title}</ReactMdCardTitle>);
    }
    if (subtitle) {
      headerChildren.push(
        <ReactMdCardSubtitle>{subtitle}</ReactMdCardSubtitle>
      );
    }
    reactMdChildren.push(
      <ReactMdCardHeader>{headerChildren}</ReactMdCardHeader>
    );
  }

  if (isArray(children)) {
    for (const child of children) {
      if (!child) {
        continue;
      }
      const reactMdChild = toReactMdCardChildElement(child);
      if (reactMdChild) {
        reactMdChildren.push(reactMdChild);
      } else {
        invalidChildren.push(child);
      }
    }
  } else if (children) {
    const reactMdChild = toReactMdCardChildElement(children);
    if (reactMdChild) {
      reactMdChildren.push(reactMdChild);
    } else {
      invalidChildren.push(children);
    }
  }

  // TODO validate that there are at most one of each child type? CreatePropositionPage has multiple
  // of each type.
  if (invalidChildren.length > 0) {
    throw new Error(
      `Card children must be one of CardHeader, CardContent, or CardActions. Invalid children: ${invalidChildren.map(
        (c) => c.type.toString()
      )}`
    );
  }

  return <ReactMdCard {...rest}>{children}</ReactMdCard>;
}

/** Converts the Howdju Card element child to its react-md version. */
function toReactMdCardChildElement(element: CardElementChild) {
  if (isElementOf(element, CardHeader)) {
    const children = (element.props as CardHeaderProps).children;
    const reactMdChildren = [];
    const invalidChildren = [];

    if (isArray(children)) {
      for (const child of children) {
        if (!child) {
          continue;
        }
        const reactMdChild = toReactMdHeaderChildElement(child);
        if (reactMdChild) {
          reactMdChildren.push(reactMdChild);
        } else {
          invalidChildren.push(child);
        }
      }
    } else if (children) {
      const reactMdChild = toReactMdCardChildElement(children);
      if (reactMdChild) {
        reactMdChildren.push(reactMdChild);
      } else {
        invalidChildren.push(children);
      }
    }
    // TODO validate that there are at most one of each child type?
    if (invalidChildren.length > 0) {
      throw new Error(
        `CardHeader children must be one of CardTitle or CardSubtitle. Invalid children: ${invalidChildren}`
      );
    }

    return (
      <ReactMdCardHeader
        {...(element.props as ReactMdCardProps)}
        children={reactMdChildren}
      />
    );
  }
  if (isElementOf(element, CardContent)) {
    return <ReactMdCardContent {...element.props} />;
  }
  if (isElementOf(element, CardActions)) {
    return (
      <ReactMdCardActions {...(element.props as ReactMdCardActionsProps)} />
    );
  }
  return undefined;
}

/** Converts the Howdju CardHeader element child to its react-md version. */
function toReactMdHeaderChildElement(element: CardHeaderElementChild) {
  if (isElementOf(element, CardTitle)) {
    return <ReactMdCardTitle {...element.props} />;
  }
  if (isElementOf(element, CardSubtitle)) {
    return <ReactMdCardSubtitle {...element.props} />;
  }
  return undefined;
}

/** Return true if element is an instance of React component. */
function isElementOf(element: ReactElement, component: FunctionComponent<any>) {
  if (isString(element.type)) {
    return element.type === component.name;
  }
  // In dev with hot reload, the element type is ProxyFacade so compare its displayName.
  // Otherwise compare the components directly.
  return element.type.name === "ProxyFacade"
    ? "displayName" in element.type
      ? element.type.displayName === component.name
      : false
    : element.type === component;
}

export interface CardHeaderProps extends ReactMdCardHeaderProps {
  children: CardHeaderChild | CardHeaderChild[];
}

export function CardHeader(props: CardHeaderProps) {
  return <ReactMdCardHeader {...props} />;
}

export interface CardTitleProps extends ReactMdCardTitleProps {}

export function CardTitle(props: CardTitleProps) {
  return <ReactMdCardTitle {...props} />;
}

export interface CardSubtitleProps extends ReactMdCardSubtitleProps {}

export function CardSubtitle(props: CardSubtitleProps) {
  return <ReactMdCardSubtitle {...props} />;
}

export interface CardContentProps extends ReactMdCardContentProps {}

export function CardContent(props: CardContentProps) {
  return <ReactMdCardContent {...props} />;
}

export interface CardActionsProps extends ReactMdCardActionsProps {}

export function CardActions(props: CardActionsProps) {
  return <ReactMdCardActions {...props} />;
}
