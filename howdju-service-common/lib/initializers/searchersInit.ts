import {
  makePropositionTextSearcher,
  makeWritTitleSearcher,
  makeWritQuoteQuoteTextSearcher,
  makePersorgsNameSearcher,
  makeSourcesDescriptionSearcher,
} from "../searchers/searchers";
import { DaosProvider } from "./daosInit";

/** Provides the searchers and previous providers. */
export type SearchersProvider = ReturnType<typeof searchersInitializer> &
  DaosProvider;

/** Initializes the searchers. */
export function searchersInitializer(provider: DaosProvider) {
  const propositionsTextSearcher = makePropositionTextSearcher(
    provider.database
  );
  const writsTitleSearcher = makeWritTitleSearcher(provider.database);
  const writQuotesQuoteTextSearcher = makeWritQuoteQuoteTextSearcher(
    provider.database
  );
  const persorgsNameSearcher = makePersorgsNameSearcher(provider.database);
  const sourcesDescriptionSearcher = makeSourcesDescriptionSearcher(
    provider.database,
    provider.sourcesDao
  );

  provider.logger.debug("searchersInit complete");

  return {
    propositionsTextSearcher,
    writsTitleSearcher,
    writQuotesQuoteTextSearcher,
    persorgsNameSearcher,
    sourcesDescriptionSearcher,
  };
}
