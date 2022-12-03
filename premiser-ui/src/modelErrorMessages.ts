import isFunction from "lodash/isFunction";
import capitalize from "lodash/capitalize";
import join from "lodash/join";
import map from "lodash/map";

import {
  modelErrorCodes,
  entityConflictCodes,
  userActionsConflictCodes,
  authorizationErrorCodes,
  ModelErrorCode,
  ErrorFormat,
  ModelErrors,
  EntityConflictCode,
  AuthorizationErrorCode,
  UserActionsConflictCode,
  errorFormatToString,
} from "howdju-common";

import { logger } from "./logger";
import { BlurredFields, DirtyFields } from "./reducers/editors";

const modelErrorMessages: Record<
  | ModelErrorCode
  | EntityConflictCode
  | AuthorizationErrorCode
  | UserActionsConflictCode,
  string
> = {
  [modelErrorCodes.MUST_BE_NONEMPTY]: "Must be non-empty",
  [modelErrorCodes.IS_REQUIRED]: "Is required",
  [modelErrorCodes.IF_PRESENT_MUST_BE_ARRAY]: "Must be array",
  [modelErrorCodes.INVALID_URL]: "Invalid URL",
  [modelErrorCodes.PROPOSITION_JUSTIFICATION_MUST_HAVE_PROPOSITION_TARGET_TYPE]:
    "Proposition's justification must have PROPOSITION target type",
  [modelErrorCodes.INVALID_VALUE]: "Invalid value",
  [modelErrorCodes.IF_PRESENT_MUST_BE_NONEMPTY]:
    "If present, must be non-empty",
  [modelErrorCodes.JUSTIFICATION_ROOT_PROPOSITION_ID_AND_TARGET_PROPOSITION_ID_MUST_BE_EQUAL]:
    "Justification root target and target proposition ID must match",

  [entityConflictCodes.ANOTHER_PROPOSITION_HAS_EQUIVALENT_TEXT]:
    "Another proposition already has equivalent text",
  [entityConflictCodes.ANOTHER_WRIT_QUOTE_HAS_EQUIVALENT_QUOTE_TEXT]:
    "That quote from that source already exists",
  [entityConflictCodes.ANOTHER_WRIT_HAS_EQUIVALENT_TITLE]:
    "That source already exists",
  [entityConflictCodes.ALREADY_EXISTS]: "That thing already exists",

  [authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES]:
    "Cannot modify another user's entities",

  [userActionsConflictCodes.OTHER_USERS_HAVE_ROOTED_JUSTIFICATIONS_IN_THIS_PROPOSITION]:
    "Other users have already created justifications rooted in this proposition",
  [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_PROPOSITION]:
    "Other users have based justifications on this proposition",
  [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT_QUOTE]:
    "Other users have already based justifications on this quote",
  [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT]:
    "Other users have already based justifications on this source",
  [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_PROPOSITION]:
    "Other users have already voted on justifications rooted in this proposition",
  [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE]:
    "Other users have already voted on justifications using this quote",
  [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT]:
    "Other users have already verified justification based on this source",
  [userActionsConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE]:
    "Other users have already countered justifications based on this quote",
  [userActionsConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT]:
    "Other users have already countered justifications based on this source",
} as const;
type MessageCode = keyof typeof modelErrorMessages;

export const toErrorMessage = (
  modelErrorCode: string | MessageCode,
  ...args: any[]
) => {
  const t =
    modelErrorCode in modelErrorMessages
      ? modelErrorMessages[modelErrorCode as MessageCode]
      : modelErrorCode;

  if (!t) {
    logger.error(`No modelErrorMessages key: ${modelErrorCode}`);
    return "";
  }
  return isFunction(t) ? t(...args) : t;
};

export const toErrorText = (modelErrorCodes: ModelErrorCode[]) =>
  capitalize(join(map(modelErrorCodes, toErrorMessage), ", "));

/**
 * Wraps a callback to swallow any indexing of undefined.
 *
 * Rethrows other errors.
 */
function propagateUndefined(callback: (...args: any[]) => any) {
  return function undefinedCatcher(...args: any[]): any {
    try {
      return callback(...args);
    } catch (e) {
      if (
        e instanceof TypeError &&
        e.message.includes("Cannot read properties of undefined")
      ) {
        return undefined;
      }
      throw e;
    }
  };
}

export const errorFormatsToText = (errors: ErrorFormat[]) =>
  capitalize(join(map(errors, errorFormatToString), ", "));

/**
 * react-md uses these two props on its field intputs.
 *
 * `error` indicates that the input should be rendered with error CSS classes applied for rendering
 * it with error coloring, and `errorText` will appear adjacent to the input.
 * */
type ReactMdErrorProps = { error?: boolean; errorText?: string };
/**
 * Creates a function that will create error props for react-md components.
 *
 * Based upon the errors and field statuses (dirty or blurred), the returned function will generate
 * React component props for react-md components to display an error.
 *
 * Use the returned helper like:
 *
 * ```
 * const errorProps = makeErrorPropCreator(errors, dirtyFields, blurredFields);
 * ...
 * const props = errorProps(model => model.field)
 * ```
 *
 * Where `entity` is typed the same as the ModelErrors, DirtyFields, and BlurredFields.
 */
export function makeErrorPropCreator<T>(
  wasSubmitAttempted: boolean,
  errors?: ModelErrors<T>,
  dirtyFields?: DirtyFields<T>,
  blurredFields?: BlurredFields<T>
) {
  return function makeErrorProps(
    // PartialDeep so that the callback handles missing dirty/blurred fields.
    fieldSelector: (entity: T) => any
  ): ReactMdErrorProps {
    // The selector is safe to cast because ModelErrors, DirtyFields, and BlurredFields all share
    // the shape of T.
    const dirtySelector = propagateUndefined(fieldSelector) as (
      t?: DirtyFields<T>
    ) =>
      | {
          _dirty: boolean;
        }
      | undefined;
    const blurredSelector = propagateUndefined(fieldSelector) as (
      t?: BlurredFields<T>
    ) =>
      | {
          _blurred: boolean;
        }
      | undefined;
    const errorsSelector = propagateUndefined(fieldSelector) as (
      t?: ModelErrors<T>
    ) =>
      | {
          _errors: ErrorFormat[];
        }
      | undefined;
    const isDirty = dirtySelector(dirtyFields)?._dirty;
    const isBlurred = blurredSelector(blurredFields)?._blurred;
    if (wasSubmitAttempted || isDirty || isBlurred) {
      const fieldErrors = errorsSelector(errors)?._errors;
      if (fieldErrors?.length) {
        return { error: true, errorText: errorFormatsToText(fieldErrors) };
      }
    }
    return {};
  };
}
