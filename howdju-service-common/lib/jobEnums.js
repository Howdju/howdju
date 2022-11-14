const { arrayToObject } = require("howdju-common");

exports.JobTypes = arrayToObject([
  "SCORE_JUSTIFICATIONS_BY_GLOBAL_VOTE_SUM",
  "SCORE_PROPOSITION_TAGS_BY_GLOBAL_VOTE_SUM",
]);

exports.JobScopes = arrayToObject(["FULL", "INCREMENTAL"]);
