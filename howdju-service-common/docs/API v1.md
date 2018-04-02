API 1:

```
GET     /search (mainSearch)
GET     /search-statements
GET     /search-tags
GET     /search-writs

GET     /tags/:tagId

POST    /statements
GET     /statements(?sorts&continuationToken&count&statementIds)
GET     /statements?tagId=:tagId
GET     /statements/:statementId
GET     /statements/:statementId?include=justifications
PUT     /statements/:statementId
DELETE  /statements/:statementId

GET     /statement-compounds/:statementCompoundId
GET     /justification-basis-compounds/:justificationBasisCompoundId
GET     /source-excerpt-paraphrases/:sourceExcerptParaphraseId

POST    /justifications
GET     /justifications(?filters&sorts&continuationToken&count)
DELETE  /justifications/:justificationId

GET     /writ-quotes(?sorts&continuationToken&count)
GET     /writ-quotes/:writQuoteId
PUT     /writ-quotes/:writQuoteId
GET     /writs?(sorts&continuationToken&count)

POST    /login
POST    /logout

POST    /justification-votes
DELETE  /justification-votes (deletes votes equivalent to body)
POST    /statement-tag-votes
DELETE  /statement-tag-votes/:statementTagVoteId

POST    /users
```
