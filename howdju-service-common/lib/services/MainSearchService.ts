import Bluebird from "bluebird";

import { WritQuotesService } from "./WritQuotesService";
import { TagsService } from "./TagsService";
import {
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
    private writsTitleSearcher: WritTitleSearcher,
    private writQuotesQuoteTextSearcher: WritQuoteQuoteTextSearcher,
    private writQuotesService: WritQuotesService,
    private persorgsNameSearcher: PersorgsNameSearcher
  ) {}

  search(searchText: string) {
    return Bluebird.props({
      tags: this.tagsService.readTagsLikeTagName(searchText),
      propositionTexts: this.propositionsTextSearcher.search(searchText),
      sources: this.sourceDescriptionSearcher.search(searchText),
      writTitles: this.writsTitleSearcher.search(searchText),
      writQuoteQuoteTexts: this.writQuotesQuoteTextSearcher.search(searchText),
      writQuoteUrls:
        this.writQuotesService.readWritQuotesHavingUrlContainingText(
          searchText
        ),
      persorgsFromName: this.persorgsNameSearcher.search(searchText),
    });
  }
}
