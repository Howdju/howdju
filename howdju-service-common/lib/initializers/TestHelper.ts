import moment, { Moment } from "moment";

import {
  AuthToken,
  CreateMediaExcerpt,
  CreateSource,
  CreateWritQuote,
  EntityId,
  utcNow,
  WritQuoteOut,
} from "howdju-common";

import { ServicesProvider } from "./servicesInit";
import { merge } from "lodash";

/** A helper for integration tests to create test data. */
export default class TestHelper {
  private servicesProvider: ServicesProvider;
  constructor(servicesProvider: ServicesProvider) {
    this.servicesProvider = servicesProvider;
  }

  async makeSource(
    creatorUserId: EntityId,
    overrides: Partial<CreateSource> = {},
    created: Moment = utcNow()
  ) {
    const createSource: CreateSource = merge(
      {},
      {
        descriptionApa: "The source description (APA)",
      },
      overrides
    );
    const { source } =
      await this.servicesProvider.sourcesService.readOrCreateSource(
        creatorUserId,
        createSource,
        created
      );
    return source;
  }

  async makeMediaExcerpt(
    authToken: AuthToken,
    overrides: Partial<CreateMediaExcerpt> = {}
  ) {
    const createMediaExcerpt = merge({}, defaultMediaExcerpt, overrides);
    const { mediaExcerpt } =
      await this.servicesProvider.mediaExcerptsService.readOrCreateMediaExcerpt(
        authToken,
        createMediaExcerpt
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

const defaultMediaExcerpt: CreateMediaExcerpt = {
  localRep: { quotation: "the text quote" },
  locators: {
    urlLocators: [
      {
        url: {
          url: "https://www.example.com",
        },
        anchors: [
          {
            exactText: "exact text",
            prefixText: "prefix text",
            suffixText: "suffix text",
            startOffset: 0,
            endOffset: 1,
          },
        ],
      },
    ],
  },
  citations: [
    {
      source: {
        descriptionApa: "the APA description",
      },
      pincite: "the pincite",
    },
    {
      source: {
        descriptionApa: "the APA description",
      },
      // no pincite
    },
  ],
  speakers: [{ name: "the speaker", isOrganization: false }],
};
