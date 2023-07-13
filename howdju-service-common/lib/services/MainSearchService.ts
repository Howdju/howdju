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

export class MainSearchService {
  constructor(
    private tagsService: TagsService,
    private propositionsTextSearcher: PropositionTextSearcher,
    private sourceDescriptionSearcher: SourceDescriptionSearcher,
    private mediaExcerptsSearcher: MediaExcerptsSearcher,
    private writsTitleSearcher: WritTitleSearcher,
    private writQuotesQuoteTextSearcher: WritQuoteQuoteTextSearcher,
    private writQuotesService: WritQuotesService,
    private persorgsNameSearcher: PersorgsNameSearcher
  ) {}

  search(searchText: string) {
    return Bluebird.props({
      mediaExcerpts: this.mediaExcerptsSearcher.search(searchText),
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
