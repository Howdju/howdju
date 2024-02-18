import { MainSearchService } from "..";
import {
  makePropositionTextSearcher,
  makeWritTitleSearcher,
  makePersorgsNameSearcher,
  makeSourceDescriptionSearcher,
  makeMediaExcerptSearcher,
} from "../searchers/searchers";
import { ServicesProvider } from "./servicesInit";

/** Provides the searchers and previous providers. */
export type SearchersProvider = ReturnType<typeof searchersInitializer> &
  ServicesProvider;

/** Initializes the searchers. */
export function searchersInitializer(provider: ServicesProvider) {
  const propositionsTextSearcher = makePropositionTextSearcher(
    provider.database,
    provider.propositionsService
  );
  // TODO(#201) remove everything writ-related
  const writsTitleSearcher = makeWritTitleSearcher(
    provider.database,
    provider.writsService
  );
  const persorgsNameSearcher = makePersorgsNameSearcher(
    provider.database,
    provider.persorgsService
  );
  const sourceDescriptionSearcher = makeSourceDescriptionSearcher(
    provider.database,
    provider.sourcesService
  );
  const mediaExcerptsSearcher = makeMediaExcerptSearcher(
    provider.database,
    provider.mediaExcerptsService
  );

  const mainSearchService = new MainSearchService(
    provider.tagsService,
    propositionsTextSearcher,
    sourceDescriptionSearcher,
    mediaExcerptsSearcher,
    provider.mediaExcerptsService,
    persorgsNameSearcher
  );

  provider.logger.debug("searchersInit complete");

  return {
    mainSearchService,
    propositionsTextSearcher,
    writsTitleSearcher,
    persorgsNameSearcher,
    sourceDescriptionSearcher,
    mediaExcerptsSearcher,
  };
}
