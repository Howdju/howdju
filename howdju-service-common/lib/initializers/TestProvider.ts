import { assign } from "lodash";

import { TopicMessageSender } from "howdju-common";
import { FakeTopicMessageSender } from "howdju-test-common";

import { baseConfig } from "../config";
import { Database } from "../database";
import { daosInitializer } from "./daosInit";
import { searchersInitializer } from "./searchersInit";
import { servicesInitializer, ServicesProvider } from "./servicesInit";
import { validatorsInitializer } from "./validatorsInit";
import { DatabaseProvider } from "./databaseInit";
import { LoggerProvider } from "./loggerInit";
import { AwsProvider } from "./awsInit";
import TestHelper from "./TestHelper";

/**
 * A dependency locator for tests.
 *
 * This test-only provider mirrors the ApiProvider we use in the API.
 *
 * An additional downside of it is that it must construct all dependencies regardless of what the
 * test actually requests., which shouldn't be terrible since by definition it should not have any
 * expensive resources for tests.
 */
export class TestProvider {
  isProduction = false;
  logger = console;
  appConfig = baseConfig;
  database: Database;
  topicMessageSender: TopicMessageSender;

  constructor(database: Database) {
    this.database = database;
    this.topicMessageSender = new FakeTopicMessageSender();

    assign(this, daosInitializer(this as unknown as DatabaseProvider));
    assign(this, searchersInitializer(this as unknown as DatabaseProvider));
    assign(this, validatorsInitializer(this as unknown as LoggerProvider));
    assign(this, servicesInitializer(this as unknown as AwsProvider));
    const servicesProvider = this as unknown as ServicesProvider;
    assign(this, {
      testHelper: new TestHelper(servicesProvider),
    });

    this.logger.debug("TestProvider initialization complete");
  }

  getConfigVal(_configValName: string, _defaultConfigVal: any) {
    throw new Error("TestProvider does not get config vals.");
  }
}

export function makeTestProvider(database: Database) {
  return new TestProvider(database) as unknown as ServicesProvider & {
    testHelper: TestHelper;
  };
}
