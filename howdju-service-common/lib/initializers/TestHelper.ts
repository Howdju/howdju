import moment from "moment";

import {
  AuthToken,
  CreateMediaExcerptCitation,
  CreatePersorg,
  CreateSource,
  CreateUrlLocator,
  CreateWritQuote,
  EntityId,
  utcNow,
  WritQuoteOut,
} from "howdju-common";

import { ServicesProvider } from "./servicesInit";

/** A helper for integration tests to create test data. */
export default class TestHelper {
  private servicesProvider: ServicesProvider;
  constructor(servicesProvider: ServicesProvider) {
    this.servicesProvider = servicesProvider;
  }

  async makeSource(
    creatorUserId: EntityId,
    createSource: Partial<CreateSource>
  ) {
    const created = utcNow();
    const { source } =
      await this.servicesProvider.sourcesService.readOrCreateSource(
        creatorUserId,
        { descriptionApa: "The source description (APA)", ...createSource },
        created
      );
    return source;
  }

  async makeMediaExcerpt(
    authToken: AuthToken,
    {
      quotation,
      urlLocators = [],
      citations,
      speakers,
    }: {
      quotation: string;
      urlLocators?: CreateUrlLocator[];
      citations?: CreateMediaExcerptCitation[];
      speakers?: CreatePersorg[];
    }
  ) {
    const { mediaExcerpt } =
      await this.servicesProvider.mediaExcerptsService.readOrCreateMediaExcerpt(
        authToken,
        {
          localRep: {
            quotation,
          },
          locators: {
            urlLocators,
          },
          citations,
          speakers,
        }
      );
    return mediaExcerpt;
  }

  async makeUser() {
    const now = moment();
    const creatorUserId = null;
    const userData = {
      email: "user@domain.com",
      username: "the-username",
      isActive: true,
    };

    const user = await this.servicesProvider.usersDao.createUser(
      userData,
      creatorUserId,
      now
    );
    const { authToken } =
      await this.servicesProvider.authService.createAuthToken(user, now);
    return { user, authToken };
  }

  async makeWritQuote({
    authToken,
  }: {
    authToken: AuthToken;
  }): Promise<WritQuoteOut> {
    const createWritQuote: CreateWritQuote = {
      quoteText: "What if a much of a wind",
      writ: {
        title: "Leaves of grass",
      },
      urls: [],
    };
    const { writQuote } =
      await this.servicesProvider.writQuotesService.createWritQuote({
        authToken,
        writQuote: createWritQuote,
      });
    return writQuote;
  }

  async makeUrl({ userId }: { userId: string }) {
    const createUrl = {
      url: "https://www.poetryfoundation.org/poems/153876/what-if-a-much-of-a-which-of-a-wind",
    };
    return await this.servicesProvider.urlsService.readOrCreateUrlAsUser(
      createUrl,
      userId,
      utcNow()
    );
  }
}
