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

/** A provider for tests.
 *
 * This is basically a low-fi DI container. The benefit of using this is that it mirrors the
 * ApiProvider we were already using in the API. And at least we are encouraged to structure our
 * classes using DI and SRP.
 *
 * The downsides are:
 *
 * 1) it's not flexible; it's tedious to change deps since we hard code their relations.
 * 2) it must construct all dependencies regardless of what the test actually requests., which is
 *    not too bad for the TestProvider since by definition it should not have any expensive resources
 *    for tests.
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

    this.logger.debug("TestProvider initialization complete");
  }

  getConfigVal(_configValName: string, _defaultConfigVal: any) {
    throw new Error("TestProvider does not get config vals.");
  }
}

export function makeTestProvider(database: Database) {
  return new TestProvider(database) as unknown as ServicesProvider;
}
