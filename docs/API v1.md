API 1:

```
GET     /search (mainSearch)
GET     /search-propositions
GET     /search-tags
GET     /search-writs

GET     /tags/:tagId

POST    /propositions
GET     /propositions(?sorts&continuationToken&count&propositionIds)
GET     /propositions?tagId=:tagId
GET     /propositions/:propositionId
GET     /propositions/:propositionId?include=justifications
PUT     /propositions/:propositionId
DELETE  /propositions/:propositionId

GET     /proposition-compounds/:propositionCompoundId
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
POST    /proposition-tag-votes
DELETE  /proposition-tag-votes/:propositionTagVoteId

POST    /users
```
