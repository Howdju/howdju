# TODO

* Version API
* Add correlation ID to all logging

* rename callback to respond
* http://ramdajs.com/ ? 
* Add route permissions

* scheduled jobs
  * calculate scores
  * sweep authentication tokens
  * aggregate old votes (delete intervening deletions)
  * enforce constraints, 
    * like unique IDs, 
    * unique statement text, 
    * citation reference quote, 
    * citation text
    * citation reference must have citation_id
  * Delete URLS when nothing references them?
  * Delete statement compounds all of whose statements are deleted
  * Sources having internal inconsistencies (citations ultimately both support and oppose the same statement)
* Short IDs

* Update prod DB, update queries to handle deleted, add action logging
##
* Logging: https://www.reddit.com/r/node/comments/26mf7e/winston_logging_replacementalternative/
* [babel](https://github.com/babel/example-node-server#getting-ready-for-production-use)
* CORS
  * https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
## Maybe
* Create views for undeleted entities
* Add CORS to error 500 responses?
* [Versioning](https://docs.aws.amazon.com/lambda/latest/dg/versioning-aliases.html)?
* [pg native](https://github.com/brianc/node-postgres#native-bindings)
* delete passed token upon re-login?
* Factor common code into premiser-common package (util, models)
* [validator](https://www.npmjs.com/package/validator)