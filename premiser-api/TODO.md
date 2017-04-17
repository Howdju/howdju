# TODO
* Verify justification
  * animations
  * redirect user to login
    * If users navigates without logging in, and later logs in via direct navigation, redirect them to default
* rename callback to respond

* Version API
* Add correlation ID to all logging
* factor out withAuthorization check
* factor out queries in repositories?
* http://ramdajs.com/ ? 
* Add route permissions
* scheduled jobs
  * calculate scores
  * sweep authentication tokens
  * aggregate old votes
* Short IDs
* Update prod DB, update queries to handle deleted, add action logging
##
* Logging: https://www.reddit.com/r/node/comments/26mf7e/winston_logging_replacementalternative/
* [babel](https://github.com/babel/example-node-server#getting-ready-for-production-use)
* CORS
  * https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
## Maybe
* [Versioning](https://docs.aws.amazon.com/lambda/latest/dg/versioning-aliases.html)?
* [pg native](https://github.com/brianc/node-postgres#native-bindings)
* delete passed token upon re-login?
* Factor common code into premiser-common package (util, models)