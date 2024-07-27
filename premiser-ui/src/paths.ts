import { createPath, LocationDescriptorObject } from "history";
import isEmpty from "lodash/isEmpty";
import queryString from "query-string";

import {
  ContextTrailItem,
  EntityId,
  JustificationBasisSourceType,
  JustificationRootTargetTypes,
  JustificationSearchFilters,
  newExhaustedEnumError,
  PersistedEntity,
  PersistedJustificationWithRootRef,
  PersorgOut,
  serializeContextTrail,
  SourceOut,
  TagOut,
  toSlug,
  WritQuoteOut,
  WritRef,
} from "howdju-common";

import { logger } from "./logger";
import { PropositionRefView } from "./viewModels";

export const mainSearchPathName = "/";

export const createJustificationPath = "/create-justification";

// TODO(196): separate into a const Record of paths (with parameters) and individual top-file-level
// factories for paths taking parameters.
class Paths {
  home = () => "/";

  recentActivity = () => "/recent-activity";
  explore = () => "/explore";
  about = () => "/about";

  login = () => "/login";
  requestRegistration = () => "/request-registration";
  requestPasswordReset = () => "/request-password-reset";

  proposition = (
    proposition: PropositionRefView,
    contextTrailItems?: ContextTrailItem[],
    noSlug = false,
    focusJustificationId: EntityId | null = null
  ) => {
    const { id, slug } = proposition;
    if (!id) {
      return "#";
    }
    const slugPath = !noSlug && slug ? "/" + slug : "";
    const query = createContextTrailQuery(contextTrailItems);
    const anchor = focusJustificationId
      ? `#justification-${focusJustificationId}`
      : "";
    return `/p/${id}${slugPath}${query}${anchor}`;
  };
  statement = (
    statementId: EntityId,
    contextTrailItems?: ContextTrailItem[],
    focusJustificationId?: EntityId
  ) => {
    const query = createContextTrailQuery(contextTrailItems);
    const anchor = focusJustificationId
      ? `#justification-${focusJustificationId}`
      : "";
    return `/s/${statementId}${query}${anchor}`;
  };
  justification = (j: PersistedJustificationWithRootRef) => {
    switch (j.rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION:
        return this.proposition(j.rootTarget, [], false, j.id);
      case JustificationRootTargetTypes.STATEMENT:
        return this.statement(j.rootTarget.id, undefined, j.id);
      default:
        throw newExhaustedEnumError(j);
    }
  };

  persorg = (persorg: PersorgOut) =>
    `/persorgs/${persorg.id}/${toSlug(persorg.name)}`;

  writQuote = (writQuote: WritQuoteOut) =>
    `/writ-quotes/${writQuote.id}/${toSlug(writQuote.writ.title)}`;

  writUsages = (writ: WritRef) =>
    this.searchJustifications({ writId: writ.id });
  writQuoteUsages = (writQuote: WritQuoteOut) => {
    if (!writQuote.id) {
      return "#";
    }
    return this.searchJustifications({ writQuoteId: writQuote.id });
  };

  createJustification = (
    basisSourceType: JustificationBasisSourceType,
    basisSourceId: EntityId
  ) => {
    const location: LocationDescriptorObject = {
      pathname: createJustificationPath,
    };
    if (basisSourceType || basisSourceId) {
      if (!(basisSourceType && basisSourceId)) {
        logger.warn(
          `If either of basisSourceType/basisSourceId are present, both must be: basisSourceType: ${basisSourceType} basisSourceId: ${basisSourceId}.`
        );
      }
      location["search"] =
        "?" + queryString.stringify({ basisSourceType, basisSourceId });
    }
    return createPath(location);
  };

  createAppearance = (mediaExcerptId: EntityId) =>
    `/media-excerpts/${mediaExcerptId}/appearances/new`;

  factCheck(userIds: EntityId[], sourceIds: EntityId[], urlIds: EntityId[]) {
    return createPath({
      pathname: `/fact-checks/`,
      search: "?" + queryString.stringify({ userIds, sourceIds, urlIds }),
    });
  }

  searchJustifications = (params: JustificationSearchFilters) =>
    createPath({
      pathname: "/search-justifications",
      search: "?" + queryString.stringify(params),
    });
  mainSearch = (mainSearchText: string) =>
    createPath({
      pathname: mainSearchPathName,
      search: "?" + window.encodeURIComponent(mainSearchText),
    });
  propositionUsages = (propositionId: EntityId) =>
    `/propositions/${propositionId}/usages`;
  statementUsages = (statementId: EntityId) =>
    `/statement-usages?statementId=${statementId}`;

  mediaExcerpt = (
    mediaExcerpt: PersistedEntity,
    contextTrailItems?: ContextTrailItem[]
  ) => {
    const query = createContextTrailQuery(contextTrailItems);
    return `/media-excerpts/${mediaExcerpt.id}${query}`;
  };
  source = (source: SourceOut) =>
    `/sources/${source.id}/${toSlug(source.description)}`;
  submitMediaExcerpt = () => "/media-excerpts/new";

  appearance = (appearanceId: EntityId) => `/appearances/${appearanceId}`;

  tools = () => "/tools";

  settings = () => "/settings";
  privacySettings = () => "/settings/privacy";

  policies = () => "https://docs.howdju.com/policies";
  principles = () => "https://docs.howdju.com/principles";
  userAgreement = () => "https://docs.howdju.com/policies/user-agreement";
  codeOfConduct = () => "https://docs.howdju.com/policies/code-of-conduct";
  privacyPolicy = () => "https://docs.howdju.com/policies/privacy-policy";
  cookieNotice = () => "https://docs.howdju.com/policies/cookie-notice";
  faq = () => "/faq";

  tag = (tag: TagOut) => `/tags/${tag.id}/${toSlug(tag.name)}`;
}

function createContextTrailQuery(
  contextTrailItems: ContextTrailItem[] | undefined
): string {
  return contextTrailItems && !isEmpty(contextTrailItems)
    ? "?context-trail=" + serializeContextTrail(contextTrailItems)
    : "";
}

export default new Paths();
