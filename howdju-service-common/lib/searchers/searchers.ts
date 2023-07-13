import { SourceOut } from "howdju-common";

import { Database } from "../database";
import {
  PersorgData,
  PropositionData,
  PropositionRow,
  SourceRow,
  SourcesDao,
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
} from "../daos/orm";
import { TextSearcher } from "./TextSearcher";
import { toIdString } from "../daos/daosUtil";

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

export const makeSourceDescriptionSearcher = (
  database: Database,
  sourcesDao: SourcesDao
) =>
  new TextSearcher<SourceRow, SourceOut>(
    database,
    "sources",
    "description",
    function ({ source_id }: SourceRow) {
      return sourcesDao.readSourceForId(toIdString(source_id));
    },
    "source_id"
  );
export type SourceDescriptionSearcher = ReturnType<
  typeof makeSourceDescriptionSearcher
>;
