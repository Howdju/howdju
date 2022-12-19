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

/** A provider for tests. */
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
