import { Database } from "..";
import { toProposition, toWrit, toWritQuote, toPersorg } from "../daos/orm";

import { TextSearcher } from "./TextSearcher";

export const makePropositionTextSearcher = (database: Database) =>
  new TextSearcher(
    database,
    "propositions",
    "text",
    toProposition,
    "proposition_id"
  );
export const makeWritTitleSearcher = (database: Database) =>
  new TextSearcher(database, "writs", "title", toWrit, "writ_id");
export const makeWritQuoteQuoteTextSearcher = (database: Database) =>
  new TextSearcher(
    database,
    "writ_quotes",
    "quote_text",
    toWritQuote,
    "writ_quote_id"
  );
export const makePersorgsNameSearcher = (database: Database) =>
  new TextSearcher(database, "persorgs", "name", toPersorg, "persorg_id");
