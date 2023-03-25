import { Entity, JustificationOut, Url, WritQuoteOut } from "howdju-common";
import { FocusEvent, MouseEvent } from "react";
import { logger } from "./logger";

/**
 * The type that react-md expects for menu items.
 *
 * This allows us to type props to receive menu items.
 */
export type MenuItems = JSX.Element | JSX.Element[];

/**
 * A DOM element's `id` attribute. If passed to a container, the ID should be
 * a prefix for the child elements.
 */
export type ComponentId = string;

/**
 * A DOM element's `name` attribute which identifies it in form callbacks.
 *
 * If passed to a container, the ID should be a prefix for the child elements. The delimiter for combining
 * prefixes is `.`.
 */
export type ComponentName = string;

/** Identifies a UI widget */
export type WidgetId = string;

/** Identifies a particular editor instance's state among all editors of that type. */
export type EditorId = string;

/** A key for storing text field suggestions in the state. */
export type SuggestionsKey = string;

export type OnBlurCallback = (name: string) => void;
export type OnCheckboxBlurCallback =
  | ((event: FocusEvent<HTMLElement>) => void)
  | undefined;

export const toReactMdOnBlur = (
  onBlurCallback?: OnBlurCallback
): ReactMdOnBlur => {
  return function (event: FocusEvent<HTMLElement>) {
    if (onBlurCallback) {
      if ("name" in event.target) {
        onBlurCallback((event as FocusEvent<HTMLInputElement>).target.name);
      } else {
        logger.error(
          "Unable to call blur callback because event did not target an HTMLInputElement"
        );
      }
    }
  };
};

/**
 * The type of react-md's onBlur event.
 *
 * Sadly react-md uses HTMLElement instead of HTMLInputElement, which prevents us from acessing the
 * event's name for form state management.
 */
type ReactMdOnBlur = (event: React.FocusEvent<HTMLElement>) => void;

/**
 * Represent changes to form field properties.
 *
 * Often used for OnPropertyChange callbacks.
 */
export type PropertyChanges = { [key: string]: any };
export type OnPropertyChangeCallback = (changes: PropertyChanges) => void;
export type OnValidityChangeCallback = (isValid: boolean) => void;
export type OnKeyDownCallback = (
  event: React.KeyboardEvent<HTMLElement>
) => void;
export type OnChangeCallback = (value: number | string, event: Event) => void;
export type OnSubmitCallback = (
  event: React.FormEvent<HTMLFormElement>
) => void;
export type OnEventCallback = (event: React.SyntheticEvent) => void;

export type OnClickCallback = (event: React.MouseEvent<HTMLElement>) => void;
export type OnAddCallback = (index: number) => void;
export type OnRemoveCallback<T> = (
  // The value to be removed
  value: T,
  // The index of the value to be removed.
  index: number,
  // All the current values, including the one that will be removed.
  // `values[index]` must equal `value`.
  values: T[]
) => void;

export type OnClickJustificationWritQuoteUrl = (
  event: MouseEvent,
  justification: JustificationOut,
  writQuote: WritQuoteOut,
  url: Url
) => void;

export type ListEventCallback<T, E extends React.UIEvent = React.UIEvent> = (
  item: T,
  index: number,
  event: E
) => void;

export type ListClickCallback<T> = ListEventCallback<
  T,
  React.MouseEvent<HTMLElement>
>;
export type ListKeyDownCallback<T> = ListEventCallback<
  T,
  React.KeyboardEvent<HTMLElement>
>;

export interface PrivacyConsentCookie {
  id: string;
  accepted: boolean;
}

/** A thunk for creating a new entity. */
export type EntityFactory = () => Entity;
export type ModelFactory = () => unknown;

export const CreatePropositionPageMode = {
  /** Blank editors, optionally show and create a justification with the proposition */
  CREATE_PROPOSITION: "CREATE_PROPOSITION",

  /** Blank proposition editor, pre-populated justification information.  Supports receiving
   * basisSourceType/basisSourceId as query parameters, or if both of these are missing, expects
   * editor to have been pre-populated with propositionJustification (e.g. the browser extension passes information
   * via a window.postMessage.)
   *
   * Hides the create-justification switch.
   */
  CREATE_JUSTIFICATION: "CREATE_JUSTIFICATION",

  /** Submit writ quote-based justification via query params */
  SUBMIT_JUSTIFICATION_VIA_QUERY_STRING:
    "SUBMIT_JUSTIFICATION_VIA_QUERY_STRING",
} as const;
export type CreatePropositionPageMode =
  typeof CreatePropositionPageMode[keyof typeof CreatePropositionPageMode];
