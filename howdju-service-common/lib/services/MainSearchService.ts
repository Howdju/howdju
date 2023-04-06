import Promise from "bluebird";

import { Logger, requireArgs } from "howdju-common";

import { WritQuotesService } from "./WritQuotesService";
import { TagsService } from "./TagsService";
import {
  PersorgsNameSearcher,
  PropositionTextSearcher,
  WritQuoteQuoteTextSearcher,
  WritTitleSearcher,
} from "../searchers";

export class MainSearchService {
  logger: Logger;
  tagsService: TagsService;
  propositionsTextSearcher: PropositionTextSearcher;
  writsTitleSearcher: WritTitleSearcher;
  writQuotesQuoteTextSearcher: WritQuoteQuoteTextSearcher;
  writQuotesService: WritQuotesService;
  persorgsNameSearcher: PersorgsNameSearcher;

  constructor(
    logger: Logger,
    tagsService: TagsService,
    propositionsTextSearcher: PropositionTextSearcher,
    writsTitleSearcher: WritTitleSearcher,
    writQuotesQuoteTextSearcher: WritQuoteQuoteTextSearcher,
    writQuotesService: WritQuotesService,
    persorgsNameSearcher: PersorgsNameSearcher
  ) {
    requireArgs({
      logger,
      tagsService,
      writQuotesService,
      propositionsTextSearcher,
      writsTitleSearcher,
      writQuotesQuoteTextSearcher,
      persorgsNameSearcher,
    });
    this.logger = logger;
    this.tagsService = tagsService;
    this.propositionsTextSearcher = propositionsTextSearcher;
    this.writsTitleSearcher = writsTitleSearcher;
    this.writQuotesQuoteTextSearcher = writQuotesQuoteTextSearcher;
    this.writQuotesService = writQuotesService;
    this.persorgsNameSearcher = persorgsNameSearcher;
  }

  search(searchText: string) {
    return Promise.props({
      tags: this.tagsService.readTagsLikeTagName(searchText),
      propositionTexts: this.propositionsTextSearcher.search(searchText),
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
