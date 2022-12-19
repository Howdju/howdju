import {
  makePropositionTextSearcher,
  makeWritTitleSearcher,
  makeWritQuoteQuoteTextSearcher,
  makePersorgsNameSearcher,
} from "@/searchers/searchers";
import assign from "lodash/assign";

export function searchersInitializer(provider: any) {
  assign(provider, {
    propositionsTextSearcher: makePropositionTextSearcher(provider.database),
    writsTitleSearcher: makeWritTitleSearcher(provider.database),
    writQuotesQuoteTextSearcher: makeWritQuoteQuoteTextSearcher(
      provider.database
    ),
    persorgsNameSearcher: makePersorgsNameSearcher(provider.database),
  });

  provider.logger.debug("searchersInit complete");
}
