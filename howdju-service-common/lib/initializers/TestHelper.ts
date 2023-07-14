import moment, { Moment } from "moment";

import {
  AuthToken,
  CreateMediaExcerpt,
  CreatePersorg,
  CreateSource,
  CreateUrl,
  CreateWritQuote,
  EntityId,
  Persisted,
  UrlOut,
  User,
  utcNow,
  WritQuoteOut,
} from "howdju-common";

import { ServicesProvider } from "./servicesInit";
import { UserIdent } from "../services/types";
import { merge } from "lodash";
import { CreateUserDataIn } from "..";

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
        description: "The source description",
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
    userIdent: UserIdent,
    overrides: Partial<CreateMediaExcerpt> = {}
  ) {
    const createMediaExcerpt = merge({}, defaultMediaExcerpt, overrides);
    const { mediaExcerpt } =
      await this.servicesProvider.mediaExcerptsService.readOrCreateMediaExcerpt(
        userIdent,
        createMediaExcerpt
      );
    return mediaExcerpt;
  }

  async makeProposition(authToken: AuthToken) {
    const createProposition = {
      text: "The proposition text",
    };
    const { proposition } =
      await this.servicesProvider.propositionsService.readOrCreateProposition(
        authToken,
        createProposition
      );
    return proposition;
  }

  async makePersorg(
    creatorUserId: EntityId,
    overrides?: Partial<CreatePersorg>
  ) {
    const createPersorg = merge({}, defaultCreatePersorg, overrides);
    const created = utcNow();
    const { persorg } =
      await this.servicesProvider.persorgsService.readOrCreateValidPersorgAsUser(
        createPersorg,
        creatorUserId,
        created.toDate()
      );
    return persorg;
  }

  async makeUser(overrides?: Partial<User>) {
    const now = moment();
    const creatorUserId = null;
    const userData: CreateUserDataIn = merge(
      {
        email: "user@domain.com",
        longName: "The User",
        shortName: "User",
        username: "the-username",
        isActive: true,
        acceptedTerms: now,
        affirmed13YearsOrOlder: now,
        affirmedMajorityConsent: now,
        affirmedNotGdpr: now,
      },
      overrides
    );

    const user = (await this.servicesProvider.usersDao.createUser(
      userData,
      creatorUserId,
      now
    )) as Persisted<User>;
    const { authToken } =
      (await this.servicesProvider.authService.createAuthToken(user, now)) as {
        authToken: AuthToken;
      };
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

  async makeUrl(
    { userId }: { userId: string },
    overrides?: Partial<CreateUrl>
  ): Promise<UrlOut> {
    const createUrl = merge(
      {
        url: "https://www.poetryfoundation.org/poems/153876/what-if-a-much-of-a-which-of-a-wind",
      },
      overrides
    );
    return await this.servicesProvider.urlsService.readOrCreateUrlAsUser(
      createUrl,
      userId,
      utcNow()
    );
  }
}

const defaultCreatePersorg: CreatePersorg = {
  name: "The persorg name",
  isOrganization: false,
};

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
        description: "the source description",
      },
      pincite: "the pincite",
    },
    {
      source: {
        description: "the source description",
      },
      // no pincite
    },
  ],
  speakers: [{ name: "the speaker", isOrganization: false }],
};
