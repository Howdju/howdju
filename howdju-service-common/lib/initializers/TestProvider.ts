import forEach from "lodash/forEach";

import { TopicMessageSender } from "howdju-common";
import { FakeTopicMessageSender } from "howdju-test-common";

import { baseConfig } from "@/config";
import { Database } from "@/database";
import { daosInitializer } from "./daosInit";
import { searchersInitializer } from "./searchersInit";
import { servicesInitializer } from "./servicesInit";
import { validatorsInitializer } from "./validatorsInit";

const inits = [
  daosInitializer,
  searchersInitializer,
  validatorsInitializer,
  servicesInitializer,
];

/** A provider for tests.
 *
 * This is basically a low-fi DI container. The benefit of using this is that it mirrors the
 * AppProvider we were already using in the API. And at least we are encouraged to structure our
 * classes using DI and SRP.
 *
 * The downsides are:
 *
 * 1) it's not flexible; it's not possible to change deps since we hard code their relations.
 * 2) it must construct all dependencies regardless of what the test actually requests., which is
 *    not too bad for the TestProvider since by definition it should not have any expensive resources
 *    for tests.
 */
export default class TestProvider {
  isProduction = false;
  logger = console;
  appConfig = baseConfig;
  database: Database;
  topicMessageSender: TopicMessageSender;

  constructor(database: Database) {
    this.database = database;
    this.topicMessageSender = new FakeTopicMessageSender();

    forEach(inits, (init: any) => init(this));

    this.logger.debug("TestProvider initialization complete");
  }

  getConfigVal(_configValName: string, _defaultConfigVal: any) {
    throw new Error("TestProvider does not get config vals.");
  }
}
