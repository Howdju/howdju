import Bluebird from "bluebird";

import { TagsService } from "./TagsService";
import {
  MediaExcerptsSearcher,
  PersorgsNameSearcher,
  PropositionTextSearcher,
  SourceDescriptionSearcher,
} from "../searchers";
import { MediaExcerptsService } from "./MediaExcerptsService";
import { AuthToken, isDomain, isUrl } from "howdju-common";

const MAX_EXCERPT_COUNT = 50;

export class MainSearchService {
  constructor(
    private tagsService: TagsService,
    private propositionsTextSearcher: PropositionTextSearcher,
    private sourceDescriptionSearcher: SourceDescriptionSearcher,
    private mediaExcerptsSearcher: MediaExcerptsSearcher,
    private mediaExcerptsService: MediaExcerptsService,
    private persorgsNameSearcher: PersorgsNameSearcher
  ) {}

  async search(authToken: AuthToken | undefined, searchText: string) {
    searchText = searchText.trim();
    if (!searchText) {
      return Bluebird.resolve({
        mediaExcerpts: [],
        persorgs: [],
        propositions: [],
        sources: [],
        tags: [],
      });
    }
    // TODO(466) combine search clauses per entity.
    const mediaExcerpts = await this.searchMediaExcerpts(authToken, searchText);
    // TODO(466) unify entities into a singular search result.
    return Bluebird.props({
      mediaExcerpts,
      persorgs: this.persorgsNameSearcher.search(authToken, searchText),
      propositions: this.propositionsTextSearcher.search(authToken, searchText),
      sources: this.sourceDescriptionSearcher.search(authToken, searchText),
      tags: this.tagsService.readTagsLikeTagName(searchText),
    });
  }

  private async searchMediaExcerpts(
    authToken: AuthToken | undefined,
    searchText: string
  ) {
    const isDomainSearch = isDomain(searchText);
    if (isDomainSearch) {
      const { mediaExcerpts } =
        await this.mediaExcerptsService.readMediaExcerpts(
          { domain: searchText },
          [],
          undefined,
          // TODO(466) handle continuationTokens in main search and decrease the request count.
          MAX_EXCERPT_COUNT
        );
      return mediaExcerpts;
    }
    const isUrlSearch = isUrl(searchText);
    if (isUrlSearch) {
      const { mediaExcerpts } =
        await this.mediaExcerptsService.readMediaExcerpts(
          { url: searchText },
          [],
          undefined,
          // TODO(466) handle continuationTokens in main search and decrease the request count.
          MAX_EXCERPT_COUNT
        );
      return mediaExcerpts;
    }

    return this.mediaExcerptsSearcher.search(authToken, searchText);
  }
}
