# TODO
* authentication_token expires is not right
* delete token upon logout, add device ID to token and browser and pass with login; remove previous tokens matching device ID
* Update prod DB, update queries to handle deleted, add action logging
* CORS
  * https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
* scheduled jobs
  * calculate scores
  * sweep authentication tokens
* Short IDs
## Maybe
* [Versioning](https://docs.aws.amazon.com/lambda/latest/dg/versioning-aliases.html)?
* [pg native](https://github.com/brianc/node-postgres#native-bindings)