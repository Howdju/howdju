const Promise = require('bluebird')

const {
  requireArgs
} = require('howdju-common')

exports.MainSearchService = class MainSearchService {
  constructor(
    logger,
    tagsService,
    statementsTextSearcher,
    writsTitleSearcher,
    writQuotesQuoteTextSearcher,
    writQuotesService
  ) {
    requireArgs({
      logger,
      tagsService,
      writQuotesService,
      statementsTextSearcher,
      writsTitleSearcher,
      writQuotesQuoteTextSearcher
    })
    this.logger = logger
    this.tagsService = tagsService
    this.statementsTextSearcher = statementsTextSearcher
    this.writsTitleSearcher = writsTitleSearcher
    this.writQuotesQuoteTextSearcher = writQuotesQuoteTextSearcher
    this.writQuotesService = writQuotesService
  }

  search(searchText) {
    return Promise.props({
      tags: this.tagsService.readTagsLikeTagName(searchText),
      statementTexts: this.statementsTextSearcher.search(searchText),
      writTitles: this.writsTitleSearcher.search(searchText),
      writQuoteQuoteTexts: this.writQuotesQuoteTextSearcher.search(searchText),
      writQuoteUrls: this.writQuotesService.readWritQuotesHavingUrlContainingText(searchText),
    })
  }
}
