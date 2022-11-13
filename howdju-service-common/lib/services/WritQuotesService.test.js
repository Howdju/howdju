const moment = require('moment')

const {
  mockLogger,
} = require('howdju-test-common')

const { WritQuotesService } = require("./WritQuotesService")

describe('WritQuotesService', () => {
  describe('createWritQuote', () => {
    it('creates a WritQuote', async () => {
      const userId = 123
      const quoteText = "Fourscore and seven year ago…"
      const title = "The Gettysburg address"
      const url = "http://history.com"
      const urls = [
        {url},
      ]
      const writQuoteInput = {
        quoteText,
        writ: {
          title,
        },
        urls,
      }
      const dbWrit = {
        id: 5,
        title,
      }
      const dbWritQuote = {
        id: 2,
        quoteText,
      }
      const dbUrls = [
        {id: 4, url},
      ]

      const writQuoteValidator = {
        validate: jest.fn(() => ({})),
      }
      const authService = {
        readUserIdForAuthToken: jest.fn(() => userId),
      }
      const actionsService = {
        asyncRecordAction: jest.fn(),
      }
      const writsService = {}
      const writsDao = {
        readWritEquivalentTo: jest.fn(() => null),
        createWrit: jest.fn(() => dbWrit),
      }
      const urlsService = {
        readOrCreateUrlsAsUser: jest.fn(() => dbUrls),
      }
      const writQuotesDao = {
        createWritQuote: jest.fn(() => dbWritQuote),
        createWritQuoteUrls: jest.fn(),
      }
      const permissionsDao = {}
      const writQuotesService = new WritQuotesService(
        mockLogger,
        writQuoteValidator,
        actionsService,
        authService,
        writsService,
        urlsService,
        writQuotesDao,
        writsDao,
        permissionsDao)

      const {writQuote: writQuoteOutput} = await writQuotesService.createWritQuote({writQuote: writQuoteInput})

      const expectedWritQuoteOutput = {
        id: 2,
        quoteText,
        writ: {
          id: 5,
          title,
        },
        urls: dbUrls,
      }
      expect(writQuoteOutput).toEqual(expectedWritQuoteOutput)
      expect(writQuotesDao.createWritQuoteUrls).toHaveBeenCalledWith(expectedWritQuoteOutput, dbUrls, userId, expect.any(moment))
    })
    it('reuses an extant Writ', async () => {
      const userId = 123
      const quoteText = "Fourscore and seven year ago…"
      const title = "The Gettysburg address"
      const url = "http://history.com"
      const urls = [
        {url},
      ]
      const writQuoteInput = {
        quoteText,
        writ: {
          title,
        },
        urls,
      }
      const dbWrit = {
        id: 5,
        title,
      }
      const dbWritQuote = {
        id: 2,
        quoteText,
      }

      const writQuoteValidator = {
        validate: jest.fn(() => ({})),
      }
      const authService = {
        readUserIdForAuthToken: jest.fn(() => userId),
      }
      const actionsService = {
        asyncRecordAction: jest.fn(),
      }
      const writsService = {}
      const writsDao = {
        readWritEquivalentTo: jest.fn(() => dbWrit),
      }
      const urlsService = {
        readOrCreateUrlsAsUser: jest.fn(() => urls),
      }
      const writQuotesDao = {
        readWritQuoteEquivalentTo: jest.fn(() => null),
        createWritQuote: jest.fn(() => dbWritQuote),
        createWritQuoteUrls: jest.fn(),
      }
      const permissionsDao = {}
      const writQuotesService = new WritQuotesService(
        mockLogger,
        writQuoteValidator,
        actionsService,
        authService,
        writsService,
        urlsService,
        writQuotesDao,
        writsDao,
        permissionsDao)

      const {writQuote: writQuoteOutput} = await writQuotesService.createWritQuote({writQuote: writQuoteInput})

      const expectedWritQuoteOutput = {
        id: 2,
        quoteText,
        writ: {
          id: 5,
          title,
        },
        urls,
      }
      expect(writQuoteOutput).toEqual(expectedWritQuoteOutput)
      expect(writQuotesDao.createWritQuoteUrls).toHaveBeenCalled()
    })
    it('reuses an extant WritQuote', async () => {
      const userId = 123
      const quoteText = "Fourscore and seven year ago…"
      const title = "The Gettysburg address"
      const url = "http://history.com"
      const urls = [
        {url},
      ]
      const writQuoteInput = {
        quoteText,
        writ: {
          title,
        },
        urls,
      }
      const dbWrit = {
        id: 5,
        title,
      }
      const dbWritQuote = {
        id: 2,
        quoteText,
        urls: [
          {id: 4, url},
        ],
      }

      const writQuoteValidator = {
        validate: jest.fn(() => ({})),
      }
      const authService = {
        readUserIdForAuthToken: jest.fn(() => userId),
      }
      const actionsService = {
        asyncRecordAction: jest.fn(),
      }
      const writsService = {}
      const writsDao = {
        readWritEquivalentTo: jest.fn(() => dbWrit),
      }
      const urlsService = {
        readOrCreateUrlsAsUser: jest.fn(),
      }
      const writQuotesDao = {
        readWritQuoteEquivalentTo: jest.fn(() => dbWritQuote),
        createWritQuoteUrls: jest.fn(),
      }
      const permissionsDao = {}
      const writQuotesService = new WritQuotesService(
        mockLogger,
        writQuoteValidator,
        actionsService,
        authService,
        writsService,
        urlsService,
        writQuotesDao,
        writsDao,
        permissionsDao)

      // Act
      const {writQuote: writQuoteOutput} = await writQuotesService.createWritQuote({writQuote: writQuoteInput})

      // Assert
      const expectedWritQuoteOutput = {
        id: 2,
        quoteText,
        writ: {
          id: 5,
          title,
        },
        urls: [
          {id: 4, url},
        ],
      }
      expect(writQuoteOutput).toEqual(expectedWritQuoteOutput)
      expect(writQuotesDao.createWritQuoteUrls).not.toHaveBeenCalled()
    })
    // TODO it 'reuses extant Urls'
  })
})
