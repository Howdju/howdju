import { Entity, EntityId } from "howdju-common";

export interface ContextTrailItem {
  targetType: "PROPOSITION" | "STATEMENT",
  targetId: EntityId
}

/** Identifies a UI widget */
export type WidgetId = string

/** Identifies a particular editor instance's state among all editors of that type. */
export type EditorId = string

/** A key for storing text field suggestions in the state. */
export type SuggestionsKey = string

/**
 * Represent changes to form field properties.
 *
 * Often used for OnPropertyChange callbacks.
 */
export type PropertyChanges = {[key: string]: any}

export interface PrivacyConsentCookie {
  id: string
  accepted: boolean
}

/** A thunk for creating a new entity. */
export type EntityFactory = () => Entity
