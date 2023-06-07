import { Database } from "../database";
import {
  PersorgData,
  PropositionData,
  PropositionRow,
  SourceRow,
  WritData,
  WritQuoteData,
} from "../daos";
import {
  toProposition,
  toWrit,
  toWritQuote,
  toPersorg,
  ToWritMapperRow,
  ToWritQuoteMapperRow,
  ToPersorgMapperRow,
  toSource,
} from "../daos/orm";

import { TextSearcher } from "./TextSearcher";
import { SourceOut } from "howdju-common";

export const makePropositionTextSearcher = (database: Database) =>
  new TextSearcher<PropositionRow, PropositionData>(
    database,
    "propositions",
    "text",
    toProposition,
    "proposition_id"
  );
export type PropositionTextSearcher = ReturnType<
  typeof makePropositionTextSearcher
>;

export const makeWritTitleSearcher = (database: Database) =>
  new TextSearcher<ToWritMapperRow, WritData>(
    database,
    "writs",
    "title",
    toWrit,
    "writ_id"
  );
export type WritTitleSearcher = ReturnType<typeof makeWritTitleSearcher>;

export const makeWritQuoteQuoteTextSearcher = (database: Database) =>
  new TextSearcher<ToWritQuoteMapperRow, WritQuoteData>(
    database,
    "writ_quotes",
    "quote_text",
    toWritQuote,
    "writ_quote_id"
  );
export type WritQuoteQuoteTextSearcher = ReturnType<
  typeof makeWritQuoteQuoteTextSearcher
>;

export const makePersorgsNameSearcher = (database: Database) =>
  new TextSearcher<ToPersorgMapperRow, PersorgData>(
    database,
    "persorgs",
    "name",
    toPersorg,
    "persorg_id"
  );
export type PersorgsNameSearcher = ReturnType<typeof makePersorgsNameSearcher>;

export const makeSourcesDescriptionSearcher = (database: Database) =>
  new TextSearcher<SourceRow, SourceOut>(
    database,
    "sources",
    "description_apa",
    toSource,
    "source_id"
  );
export type SourcesDescriptionSearcher = ReturnType<
  typeof makeSourcesDescriptionSearcher
>;
