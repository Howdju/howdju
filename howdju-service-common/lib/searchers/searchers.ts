import { Database } from "../database";
import { TextSearcher } from "./TextSearcher";
import {
  MediaExcerptsService,
  PersorgsService,
  PropositionsService,
  SourcesService,
  WritsService,
} from "..";

export const makePropositionTextSearcher = (
  database: Database,
  propositionsService: PropositionsService
) =>
  new TextSearcher(
    database,
    "propositions",
    "text",
    (authToken, ids) =>
      propositionsService.readPropositionsForIds({ authToken }, ids),
    "proposition_id"
  );
export type PropositionTextSearcher = ReturnType<
  typeof makePropositionTextSearcher
>;

// TODO(#201) remove everything writ-related
export const makeWritTitleSearcher = (
  database: Database,
  writsService: WritsService
) =>
  new TextSearcher(
    database,
    "writs",
    "title",
    (_authToken, ids) =>
      Promise.all(ids.map((id) => writsService.readWritForId(id))),
    "writ_id"
  );
export type WritTitleSearcher = ReturnType<typeof makeWritTitleSearcher>;

export const makePersorgsNameSearcher = (
  database: Database,
  persorgsService: PersorgsService
) =>
  new TextSearcher(
    database,
    "persorgs",
    "name",
    (_authToken, ids) => persorgsService.readPersorgsForIds(ids),
    "persorg_id"
  );
export type PersorgsNameSearcher = ReturnType<typeof makePersorgsNameSearcher>;

export const makeSourceDescriptionSearcher = (
  database: Database,
  sourcesService: SourcesService
) =>
  new TextSearcher(
    database,
    "sources",
    "description",
    (_authToken, ids) => sourcesService.readSourcesForIds(ids),
    "source_id"
  );
export type SourceDescriptionSearcher = ReturnType<
  typeof makeSourceDescriptionSearcher
>;

export const makeMediaExcerptSearcher = (
  database: Database,
  mediaExcerptsService: MediaExcerptsService
) =>
  new TextSearcher(
    database,
    "media_excerpts",
    "quotation",
    (_authToken, ids) => mediaExcerptsService.readMediaExcerptsForIds(ids),
    "media_excerpt_id"
  );
export type MediaExcerptsSearcher = ReturnType<typeof makeMediaExcerptSearcher>;
