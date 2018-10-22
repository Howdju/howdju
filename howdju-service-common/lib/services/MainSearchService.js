const Promise = require('bluebird')

const {
  requireArgs
} = require('howdju-common')

exports.MainSearchService = class MainSearchService {
  constructor(
    logger,
    tagsService,
    propositionsTextSearcher,
    writsTitleSearcher,
    writQuotesQuoteTextSearcher,
    writQuotesService
  ) {
    requireArgs({
      logger,
      tagsService,
      writQuotesService,
      propositionsTextSearcher,
      writsTitleSearcher,
      writQuotesQuoteTextSearcher
    })
    this.logger = logger
    this.tagsService = tagsService
    this.propositionsTextSearcher = propositionsTextSearcher
    this.writsTitleSearcher = writsTitleSearcher
    this.writQuotesQuoteTextSearcher = writQuotesQuoteTextSearcher
    this.writQuotesService = writQuotesService
  }

  search(searchText) {
    return Promise.props({
      tags: this.tagsService.readTagsLikeTagName(searchText),
      propositionTexts: this.propositionsTextSearcher.search(searchText),
      writTitles: this.writsTitleSearcher.search(searchText),
      writQuoteQuoteTexts: this.writQuotesQuoteTextSearcher.search(searchText),
      writQuoteUrls: this.writQuotesService.readWritQuotesHavingUrlContainingText(searchText),
    })
  }
}
