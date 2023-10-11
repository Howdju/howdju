import React, { ChangeEvent, ChangeEventHandler } from "react";
import { get, isArray } from "lodash";
import queryString from "query-string";
import { Location } from "history";

import {
  isDefined,
  PropositionTagVoteOut,
  TagVote,
  CreatePropositionTagVoteInput,
} from "howdju-common";

import { MenuDivider } from "@/components/menu/MenuDivider";
import config from "./config";
import { OnPropertyChangeCallback } from "./types";
import { newInvalidUrlError } from "./uiErrors";

export const isWindowNarrow = () => {
  return window.innerWidth < config.ui.narrowBreakpoint;
};

/** Is it something handheldy that rotates? */
export const isDevice = () => isDefined(window.orientation);

export const isScreenPortrait = () => {
  const orientationType = get(window, ["screen", "orientation", "type"]);
  if (orientationType) {
    return /portrait/.test(orientationType);
  } else if (isDefined(window.orientation)) {
    return window.orientation === 0 || window.orientation === 180;
  } else {
    return window.innerWidth > window.innerHeight;
  }
};

export const isScrollPastTop = () => window.document.body.scrollTop < 0;

export const isScrollPastBottom = () => {
  // Some references for figuring this issue out:
  // https://stackoverflow.com/a/40370876/39396
  // https://stackoverflow.com/a/27335321/39396
  const body = window.document.body;
  return body.scrollTop + window.innerHeight > body.scrollHeight;
};

export const getDimensionInfo = () => {
  const { documentElement, body } = window.document;
  const dimensionInfo = {
    window: {
      innerHeight: window.innerHeight,
      outerHeight: window.outerHeight,
      pageYOffset: window.pageYOffset,
      scrollY: window.scrollY,
    },
    documentElement: {
      scrollTop: documentElement.scrollTop,
      scrollHeight: documentElement.scrollHeight,
      clientHeight: documentElement.clientHeight,
      offsetHeight: documentElement.offsetHeight,
    },
    body: {
      scrollTop: body.scrollTop,
      clientHeight: body.clientHeight,
      offsetHeight: body.offsetHeight,
      scrollHeight: body.scrollHeight,
    },
    conditions: {
      [`window.innerHeight + window.pageYOffset >= document.body.offsetHeight : ${
        window.innerHeight
      } + ${window.pageYOffset} = ${
        window.innerHeight + window.pageYOffset
      } >= ${document.body.offsetHeight}`]:
        window.innerHeight + window.pageYOffset >= document.body.offsetHeight,
      [`documentElement.clientHeight + window.pageYOffset >= document.body.offsetHeight : ${
        documentElement.clientHeight
      } + ${window.pageYOffset} = ${
        documentElement.clientHeight + window.pageYOffset
      } >= ${document.body.offsetHeight}`]:
        documentElement.clientHeight + window.pageYOffset >=
        document.body.offsetHeight,
      [`body.scrollTop + window.innerHeight >= body.scrollHeight : ${
        body.scrollTop
      } + ${window.innerHeight} = ${
        body.scrollTop + window.innerHeight
      } >= body.scrollHeight`]:
        body.scrollTop + window.innerHeight >= body.scrollHeight,
    },
  };
  return dimensionInfo;
};

/** Inserts a <Divider> between the groups of components. */
export function divideMenuItems(...componentGroups: JSX.Element[][]) {
  const dividedComponents = [];
  for (let i = 0; i < componentGroups.length; i++) {
    const components = componentGroups[i];
    dividedComponents.splice(dividedComponents.length, 0, ...components);
    if (i < componentGroups.length - 1) {
      // Assume that the keys are unique, so that we can build a unique key off of the previous component
      const lastComponentKey =
        dividedComponents[dividedComponents.length - 1].key;
      dividedComponents.push(
        <MenuDivider key={`${lastComponentKey}-divider`} />
      );
    }
  }
  return dividedComponents;
}

export const toOnChangeCallback = (
  onPropertyChange: OnPropertyChangeCallback
) => {
  return function onChange(value: any, event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    onPropertyChange({ [name]: value });
  };
};

// TODO(#17) remove
export const toCheckboxOnChangeCallback = (
  onPropertyChange: OnPropertyChangeCallback
): ((checked: boolean, event: Event) => void) => {
  return function onChange(checked: boolean, event: Event) {
    const name = (event as unknown as ChangeEvent<HTMLInputElement>).target
      .name;
    onPropertyChange({ [name]: checked });
  };
};

export function toInputOnChangeCallback(
  onPropertyChange?: OnPropertyChangeCallback
): ChangeEventHandler<any> {
  return function onChange(event: ChangeEvent<any>) {
    if (!onPropertyChange) {
      return;
    }
    onPropertyChange({ [event.target.name]: event.target.value });
  };
}

export function toTextFieldOnChangeCallback(
  onPropertyChange?: OnPropertyChangeCallback,
  transform?: (val: string | number) => string
): ChangeEventHandler<any> {
  return function onChange(event: ChangeEvent<any>) {
    if (!onPropertyChange) {
      return;
    }
    const name = event.target.name;
    const val = transform ? transform(event.target.value) : event.target.value;
    onPropertyChange({ [name]: val });
  };
}

export function getQueryParam(
  location: Location,
  name: string
): string | undefined {
  const value = get(queryString.parse(location.search), name);
  if (isArray(value)) {
    throw newInvalidUrlError(
      `Parameter ${name} must appear at most once in the URL.`
    );
  }
  return value || undefined;
}

export function toCompatibleTagVotes(
  propositionTagVotes: CreatePropositionTagVoteInput[]
): TagVote[];
export function toCompatibleTagVotes(
  propositionTagVotes: PropositionTagVoteOut[]
): TagVote[];
export function toCompatibleTagVotes(
  propositionTagVotes: PropositionTagVoteOut[] | CreatePropositionTagVoteInput[]
): TagVote[] {
  return propositionTagVotes.map(
    (v) =>
      ({
        ...v,
        target: v.proposition,
        targetType: "PROPOSITION",
      } as TagVote)
  );
}
