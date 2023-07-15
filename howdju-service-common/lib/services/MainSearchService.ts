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

  search(searchText: string) {
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
    const isUrlSearch = isUrl(searchText);
    const isDomainSearch = isDomain(searchText);
    const mediaExcerpts = isDomainSearch
      ? this.mediaExcerptsService.readMediaExcerptsMatchingDomain(searchText)
      : isUrlSearch
      ? this.mediaExcerptsService.readMediaExcerptsMatchingUrl(searchText)
      : this.mediaExcerptsSearcher.search(searchText);
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
}
