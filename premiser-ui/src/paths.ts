import { createPath, LocationDescriptorObject } from "history";
import isEmpty from "lodash/isEmpty";
import queryString from "query-string";

import {
  ContextTrailItem,
  EntityId,
  JustificationBasisSourceType,
  JustificationOut,
  JustificationRootTargetTypes,
  JustificationSearchFilters,
  MediaExcerptRef,
  newExhaustedEnumError,
  PersorgOut,
  serializeContextTrail,
  SourceOut,
  StatementRef,
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
  whatsNext = () => "/whats-next";
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
    const query =
      contextTrailItems && !isEmpty(contextTrailItems)
        ? "?context-trail=" + serializeContextTrail(contextTrailItems)
        : "";
    const anchor = focusJustificationId
      ? `#justification-${focusJustificationId}`
      : "";
    return `/p/${id}${slugPath}${anchor}${query}`;
  };
  statement = (
    statement: StatementRef,
    focusJustificationId: EntityId | null = null
  ) => {
    const anchor = focusJustificationId
      ? `#justification-${focusJustificationId}`
      : "";
    return `/s/${statement.id}${anchor}`;
  };
  justification = (j: JustificationOut) => {
    switch (j.rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION:
        return this.proposition(j.rootTarget, [], false, j.id);
      case JustificationRootTargetTypes.STATEMENT:
        return this.statement(j.rootTarget, j.id);
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
    `/proposition-usages?propositionId=${propositionId}`;
  mediaExcerptUsages = (mediaExcerptId: EntityId) =>
    `/media-excerpts/${mediaExcerptId}/usages`;
  statementUsages = (statementId: EntityId) =>
    `/statement-usages?statementId=${statementId}`;

  mediaExcerpt = (mediaExcerpt: MediaExcerptRef) =>
    `/media-excerpts/${mediaExcerpt.id}`;
  source = (source: SourceOut) =>
    `/sources/${source.id}/${toSlug(source.description)}`;
  submitMediaExcerpt = () => "/media-excerpts/new";

  tools = () => "/tools";

  settings = () => "/settings";
  privacySettings = () => "/settings/privacy";

  policiesOverview = () => "/policies";
  principles = () => "/principles";
  userAgreement = () => "/policies/user-agreement";
  codeOfConduct = () => "/policies/code-of-conduct";
  privacyPolicy = () => "/policies/privacy-policy";
  cookieNotice = () => "/policies/cookie-notice";
  faq = () => "/faq";

  tag = (tag: TagOut) => `/tags/${tag.id}/${toSlug(tag.name)}`;
}

export default new Paths();
