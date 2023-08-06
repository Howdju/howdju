/// <reference path="../../howdju-test-common/lib/globals.d.ts" />
/// <reference path="../../howdju-common/lib/dom-anchor-text-position.d.ts" />
/// <reference path="../../howdju-common/lib/dom-anchor-text-quote.d.ts" />
/// <reference path="../../howdju-text-fragment-generation/src/text-fragments-polyfill.d.ts" />

import anyPromiseRegister from "any-promise/register";
import * as moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";

// Tell any libraries that support any-promise to use Bluebird instead of the built-in.
anyPromiseRegister("bluebird", { Promise: require("bluebird") });
momentDurationFormatSetup(moment);

export * from "./apiGateway";
export * from "./config";
export * from "./daos";
export * from "./database";
export * from "./initializers";
export * from "./jobEnums";
export * from "./logging";
export * from "./permissions";
export * from "./searchers";
export * from "./services";
export * from "./util";
export * from "./validators";
export * from "./serviceErrors";
