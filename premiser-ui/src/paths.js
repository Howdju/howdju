import { createPath } from "history";
import isEmpty from "lodash/isEmpty";
import queryString from "query-string";

import {
  JustificationRootTargetTypes,
  newExhaustedEnumError,
  serializeContextTrail,
  toSlug,
} from "howdju-common";

import { logger } from "./logger";

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
    proposition,
    contextTrailItems,
    noSlug = false,
    focusJustificationId = null
  ) => {
    const { id, slug } = proposition;
    if (!id) {
      return "#";
    }
    const slugPath = !noSlug && slug ? "/" + slug : "";
    const query = !isEmpty(contextTrailItems)
      ? "?context-trail=" + serializeContextTrail(contextTrailItems)
      : "";
    const anchor = focusJustificationId
      ? `#justification-${focusJustificationId}`
      : "";
    return `/p/${id}${slugPath}${anchor}${query}`;
  };
  statement = (statement, focusJustificationId = null) => {
    const anchor = focusJustificationId
      ? `#justification-${focusJustificationId}`
      : "";
    return `/s/${statement.id}${anchor}`;
  };
  justification = (j) => {
    switch (j.rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION:
        return this.proposition(j.rootTarget, null, false, j.id);
      case JustificationRootTargetTypes.STATEMENT:
        return this.statement(j.rootTarget, j.id);
      default:
        throw newExhaustedEnumError(j.rootTargetType);
    }
  };

  persorg = (persorg) => `/persorgs/${persorg.id}/${toSlug(persorg.name)}`;

  writQuote = (writQuote) =>
    `/writ-quotes/${writQuote.id}/${toSlug(writQuote.writ.title)}`;

  writUsages = (writ) => this.searchJustifications({ writId: writ.id });
  writQuoteUsages = (writQuote) => {
    if (!writQuote.id) {
      return "#";
    }
    return this.searchJustifications({ writQuoteId: writQuote.id });
  };

  createJustification = (basisSourceType, basisSourceId) => {
    const location = {
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
  searchJustifications = (params) =>
    createPath({
      pathname: "/search-justifications",
      search: "?" + queryString.stringify(params),
    });
  mainSearch = (mainSearchText) =>
    createPath({
      pathname: mainSearchPathName,
      search: "?" + window.encodeURIComponent(mainSearchText),
    });
  propositionUsages = (propositionId) =>
    `/proposition-usages?propositionId=${propositionId}`;
  statementUsages = (statementId) =>
    `/statement-usages?propositionId=${statementId}`;

  mediaExcerpt = (mediaExcerpt) => `/media-excerpts/${mediaExcerpt.id}`;
  source = (source) => `/sources/${source.id}/${toSlug(source.descriptionApa)}`;
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

  tag = (tag) => `/tags/${tag.id}/${toSlug(tag.name)}`;
}

export default new Paths();
