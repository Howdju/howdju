import {
  makePropositionTextSearcher,
  makeWritTitleSearcher,
  makeWritQuoteQuoteTextSearcher,
  makePersorgsNameSearcher,
} from "../searchers/searchers";
import { DaosProvider } from "./daosInit";
import { DatabaseProvider } from "./databaseInit";

/** Provides the searchers and previous providers. */
export type SearchersProvider = ReturnType<typeof searchersInitializer> &
  DaosProvider;

/** Initializes the searchers. */
export function searchersInitializer(provider: DatabaseProvider) {
  const propositionsTextSearcher = makePropositionTextSearcher(
    provider.database
  );
  const writsTitleSearcher = makeWritTitleSearcher(provider.database);
  const writQuotesQuoteTextSearcher = makeWritQuoteQuoteTextSearcher(
    provider.database
  );
  const persorgsNameSearcher = makePersorgsNameSearcher(provider.database);

  provider.logger.debug("searchersInit complete");

  return {
    propositionsTextSearcher,
    writsTitleSearcher,
    writQuotesQuoteTextSearcher,
    persorgsNameSearcher,
  };
}
