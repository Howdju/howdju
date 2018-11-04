# TODO

* When searching for Trump, shows Donald Trump tag three times despite response containingg three different tags. 
* Support statement justifications
  * Redirect to Statement
   - fix grouping in entities reducer for statements
     - instead of branchJustificationsByRootPropositionId, add each justification to the appropriate entities' branchJustifications
       Do this in the API?
* If user autocompleted persorg, disable editor fields?

* Version API

* rename callback to respond
* Add route permissions

* scheduled jobs
  * calculate scores
  * sweep authentication tokens
  * collapse old votes (delete intervening deletions)
  * re-calculate normal text
  * enforce constraints, 
    * justification has root_proposition_id
    * unique IDs, 
    * unique proposition text, 
    * writ quote text, 
    * writ title
    * writ quote must have writ_id
    * atoms must have an entity
      * proposition_compound must have atoms
      * proposition_compound atoms must match something
    * source excerpt paraphrases must have paraphrasing propositions and source excerpts
  * Delete URLS when nothing references them?
  * Delete proposition compounds all of whose propositions are deleted
  * Delete old scores
  * Sources having internal inconsistencies (writs ultimately both support and oppose the same proposition)
  * Delete old job histories
* Short IDs
* [Build using Vagrant?](https://stackoverflow.com/a/30440198/39396)

* Priority queues
  * https://medium.com/netflix-techblog/distributed-delay-queues-based-on-dynomite-6b31eca37fbc
  * https://www.rabbitmq.com/priority.html
  * https://www.quora.com/Distributed-Systems-How-to-implement-a-high-availability-priority-Queue-that-can-easily-scale/answer/Ben-Darfler
* Diffing
  * https://stackoverflow.com/questions/4045017/what-is-git-diff-patience-for
  * https://stackoverflow.com/questions/32365271/whats-the-difference-between-git-diff-patience-and-git-diff-histogram
* Similarity Search
  * Do any support triplet search?  If not, how to translate?  Combine triple into one?  Have three indices (one for each of the triple)?
  * https://code.facebook.com/posts/1373769912645926/faiss-a-library-for-efficient-similarity-search/
  * https://github.com/spotify/annoy
  * https://github.com/nmslib/nmslib
  * https://github.com/erikbern/ann-benchmarks

* Data science tasks:
  * Clustering users
  * Recognizing propositions phrased as questions
  * Rewriting propositions phrased as questions as propositions 
  * Identifying semantically equivalent propositions
  * Identifying negations of propositions (semantically opposite propositions)
  * fact-checking pages

## Datasets
 * https://github.com/BuzzFeedNews/2016-10-facebook-fact-check
 * https://www.kaggle.com/mrisdal/fake-news
 * https://github.com/FakeNewsChallenge/fnc-1
   * https://github.com/FakeNewsChallenge/fnc-1-baseline
 * https://arxiv.org/pdf/1705.00648.pdf
 * https://github.com/JasonKessler/fakeout
 * https://github.com/BuzzFeedNews/everything
 * https://github.com/genyunus/Detecting_Fake_News
 
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