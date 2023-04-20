/// <reference path="../../howdju-test-common/lib/globals.d.ts" />

import bluebird from "bluebird";

// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/42084#issuecomment-581790307
global.Promise = <any>bluebird;

export { handler } from "./handler";
