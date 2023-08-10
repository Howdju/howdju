import search from "approx-string-match";

export const MAX_ACCEPTABLE_ERRORS = 50;

export function approximateMatch(document: string, query: string) {
  return search(document, query, MAX_ACCEPTABLE_ERRORS);
}
