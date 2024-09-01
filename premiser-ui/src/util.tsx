import React, { ChangeEvent, ChangeEventHandler } from "react";
import { get } from "lodash";
import moment, { Moment } from "moment";

import {
  isDefined,
  PropositionTagVoteOut,
  TagVote,
  CreatePropositionTagVoteInput,
} from "howdju-common";

import { MenuDivider } from "@/components/menu/MenuDivider";
import config from "./config";
import { OnPropertyChangeCallback } from "./types";

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

export function toToggleOnChangeCallback(
  onPropertyChange?: OnPropertyChangeCallback
): ChangeEventHandler<any> {
  return function onChange(event: ChangeEvent<HTMLInputElement>) {
    if (!onPropertyChange) {
      return;
    }
    onPropertyChange({ [event.target.name]: event.target.checked });
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

/**
 * Hashes a string into a number.
 *
 * https://github.com/bryc/code/blob/da36a3e07acfbd07f930a9212a2df9e854ff56e4/jshash/experimental/cyrb53.js
 */
export function hashString(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function formatTimestampForDisplay(timestamp: string | Moment) {
  return formatMomentForDisplay(moment(timestamp));
}

export function formatMomentForDisplay(moment: Moment) {
  return moment.local().format(config.humanDateTimeFormat);
}
