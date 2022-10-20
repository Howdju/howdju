# API 2

## Plugin

### Use case: passively fact-check sources, either currently viewing or linked therein 

"Has anyone evaluated this thing (or these things) I'm looking at right now?"

E.g.: identifiable textual content in dynamic pages (tweets, reddit comments, 
reddit self-ost)

Objects:
* Current web page (need black list to avoid dynamically generated or private pages, 
  black list applies to all URL types: e.g. don't evaluate a link in a comment
  to a dynamic page (but why is it linked, then?))
* Google search result URLs
* Facebook news feed (public posts, links within posts)
* Twitter feed (tweets and links in tweets)
* Reddit (Links in results, self-text posts, comments)

For URLs, need info about: 
  * page (claims, how recently changed, changed since stated publish date?, 
  * author/speaker (who is attributed), 
  * editor/domain (who controls the medium, how old is the entity)
For things with evaluatable textual content, need anchored propositions.

Should I split into /evaluate-sources and /evaluate-urls | /annotate-sources?
The returned values are so different...  It could also be /evaluate-sources?summary

```
POST     /evaluate-sources
{
  groupWeightOverrides: [{groupId, weight}, ...],
  evaluationLevel: summary|annotation
  sources: [
    {
      sourceType: 
        pageUrl (the page the user is currently viewing)
        linkUrl (a link anywhere in any context that doesn't meet other criteria)
         - redditLinkListingUrl
         - redditCommentUrl
         - googleSearchResultUrl
         - facebookPostUrl
         - tweetUrl
        redditComment
        tweet
        redditSelfPostListing
      sourceUrl: ...
      sourceId: ...
      content: {
        html: ...
        text: ...
        containedUrls: [{text, url}, ...]
      },
      evaluationLevel: summary|annotation (overrides top-level evaluationLevel, if any)
    },
    ...
  ]
}
```

```
POST      /annotate-sources
```

Returns either URL evaluations or anchored propositions for that source. Shows
propositions whose anchors can't be attached.  informs API about anchor attachment
failures

```
{
  sourceEvaluations: [
    {
      sourceType: ...,
      sourceId: ...,
      sourceUrl: ...,
      evaluation: {
        contentEvaluation: {...}
        speakerEvaluation: {...}
        editorialEvaluation: {...}
      }
    }
  ]
}
```

### Use case: actively fact-check text

"Has anyone evaluated this proposition or anything like it?"

```
POST    /evaluate-text
{
  groupWeightOverrides: [{groupId, weight}, ...]
  source: {
      sourceType: 
        redditLink
        redditSelfPostLink
        redditComment
        redditCommentUrl (a type of URL)
        googleSearchResultUrl (a type of URL)
        facebookComment
        facebookCommentUrl (a type of URL)
        tweet
        tweetUrl (a tyupe of URL)
        mainUrl (the page the user is currently viewing)
      sourceUrl: ...
      sourceId: ...
      content: {
        html: ...
        text: ...
        containedUrls: [{text, url}, ...]
      }
    } 
}
```

## Jobs

### User clustering

#### Initial approach
Start from a seed of manually selected clusters and hand-scored justifications.
Score users according to them (sum justification cluster vectors for all justifications the 
user has voted on (normalize to [-1,1]?))  Or how about for only those users who 
are well-covered by the justifications?  What does well-covered mean for a user?

Do a graph expansion?  Find overlap between scored users 
and justifications that appear to have good exposure from several diametric clusters, 
score those justifications according to the scored users who have voted on them.  
Then score more users using these justifications?  Stop when we no longer have
any more overlap between unused justifications having good justification coverage
and scored users?

What about users who at some stage have poor justification coverage, and get some
score, but then later have good coverage?

How about PageRank perterbationy approach?  Keep going until the vectors for
well-covered justifications/users are stable.  Then do a final pass of scoring
not well-covered justifications/users.

#### Considerations

Need to capture cases where a user recently has disagreed with another user in
case someone games the system by creating a similar user by duplicating votes
but then inserting manipulative justification votes.  Detect when a user 
does anomalous votes?  How will we know that they are anomolous?

Should we compare how a user's vector changes over time as we reach additional
stages of inference?  What if it changes drastically?  What if we return to 
previously used justifications and rescore according to the current state?  What
if we see big differences?  What about doing a global rescore phase at the end
where we see what every user's vector would be if we re-used the justifications
as currently scored?

Allow users to self-report?  Compare self-report to calculation?

Do unsupervised clustering to try and discover clusters?

Concept of showing users particular useful 'splitting' justifications to try and get them scored 
for clustering feedback.

### User vote scoring
Sums the weight vectors of the users who have voted.  The vector is negated
if the user voted against.

#### Justification scoring
#### Proposition tag scoring

### Equivalent propositions
Allow us to show justifications from equivalent propositions.

How related to returning equivalent propositions to user search? 

### Negation detection

## Web app

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

# These votes should have the optional ability to add a justification?
POST    /proposition-tag-votes
DELETE  /proposition-tag-votes/:propositionTagVoteId
POST    /proposition-equivalency-votes
POST    /proposition-negation-votes
POST    /proposition-flag-votes (opinion-based, inflammatory, advertising)
POST    /user-profile-flag-vote (inflammatory, impersonating, advertising)

POST    /users
```
