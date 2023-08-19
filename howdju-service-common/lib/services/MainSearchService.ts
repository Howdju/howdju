import Bluebird from "bluebird";

import { WritQuotesService } from "./WritQuotesService";
import { TagsService } from "./TagsService";
import {
  MediaExcerptsSearcher,
  PersorgsNameSearcher,
  PropositionTextSearcher,
  SourceDescriptionSearcher,
  WritQuoteQuoteTextSearcher,
  WritTitleSearcher,
} from "../searchers";
import { MediaExcerptsService } from "./MediaExcerptsService";
import { isDomain, isUrl } from "howdju-common";

const MAX_EXCERPT_COUNT = 50;

export class MainSearchService {
  constructor(
    private tagsService: TagsService,
    private propositionsTextSearcher: PropositionTextSearcher,
    private sourceDescriptionSearcher: SourceDescriptionSearcher,
    private mediaExcerptsSearcher: MediaExcerptsSearcher,
    private mediaExcerptsService: MediaExcerptsService,
    private writsTitleSearcher: WritTitleSearcher,
    private writQuotesQuoteTextSearcher: WritQuoteQuoteTextSearcher,
    private writQuotesService: WritQuotesService,
    private persorgsNameSearcher: PersorgsNameSearcher
  ) {}

  async search(searchText: string) {
    searchText = searchText.trim();
    if (!searchText) {
      return Bluebird.resolve({
        mediaExcerpts: [],
        persorgs: [],
        propositions: [],
        sources: [],
        tags: [],
        writTitles: [],
        writQuoteQuoteTexts: [],
        writQuoteUrls: [],
      });
    }
    // TODO(466) combine search clauses per entity.
    const mediaExcerpts = await this.searchMediaExcerpts(searchText);
    // TODO(466) unify entities into a singular search result.
    return Bluebird.props({
      mediaExcerpts,
      persorgs: this.persorgsNameSearcher.search(searchText),
      propositions: this.propositionsTextSearcher.search(searchText),
      sources: this.sourceDescriptionSearcher.search(searchText),
      tags: this.tagsService.readTagsLikeTagName(searchText),
      writTitles: this.writsTitleSearcher.search(searchText),
      writQuoteQuoteTexts: this.writQuotesQuoteTextSearcher.search(searchText),
      writQuoteUrls:
        this.writQuotesService.readWritQuotesHavingUrlContainingText(
          searchText
        ),
    });
  }

  private async searchMediaExcerpts(searchText: string) {
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

    return this.mediaExcerptsSearcher.search(searchText);
  }
}
