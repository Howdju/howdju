# TODO

* Version API
* Add compression to response (npm: oppressor)

* rename callback to respond
* http://ramdajs.com/ ? 
* Add route permissions

* scheduled jobs
  * calculate scores
  * sweep authentication tokens
  * collapse old votes (delete intervening deletions)
  * re-calculate normal text
  * enforce constraints, 
    * like unique IDs, 
    * unique statement text, 
    * writing quote text, 
    * writing title
    * writing quote must have writing_id
    * statement_compound must have atoms
    * statement_compound atoms must match something
  * Delete URLS when nothing references them?
  * Delete statement compounds all of whose statements are deleted
  * Delete old scores
  * Sources having internal inconsistencies (writings ultimately both support and oppose the same statement)
* Short IDs
* [Build using Vagrant?](https://stackoverflow.com/a/30440198/39396)

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
* [validator](https://www.npmjs.com/package/validator)