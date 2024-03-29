import { assign } from "lodash";

import { TopicMessageSender } from "howdju-common";
import { TestTopicMessageSender } from "howdju-test-common";

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
import { AppConfigProvider, AppProvider, AsyncConfig } from ".";

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

  constructor(database: Database, asyncConfig: AsyncConfig) {
    this.database = database;
    this.topicMessageSender = new TestTopicMessageSender();

    assign(this, daosInitializer(this as unknown as DatabaseProvider));
    assign(this, validatorsInitializer(this as unknown as LoggerProvider));
    assign(
      this,
      servicesInitializer(
        this as unknown as AwsProvider & AppConfigProvider,
        Promise.resolve(asyncConfig)
      )
    );
    assign(this, searchersInitializer(this as unknown as ServicesProvider));

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

const DEFAULT_ASYNC_CONFIG = {} as unknown as AsyncConfig;

export function makeTestProvider(
  database: Database,
  asyncConfig: AsyncConfig = DEFAULT_ASYNC_CONFIG
) {
  return new TestProvider(database, asyncConfig) as unknown as AppProvider & {
    testHelper: TestHelper;
  };
}
