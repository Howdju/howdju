# TODO

* Upgrade postgres
* Upgrade React/react-md

* Finish terms pages

* Absolutely necessary to add users:
  - Terms, Privacy Policy, GPDR/Cookie Policy
  - Contact, linked from abuse help note on propositions/justifications
  * notifications of signup, notification of activity
  - User activity page
  - Username display?
  - Fix homepage?
  - Fix context trail?
  - Provide better documentation?  (comparison to other sites, use cases, motivation: 
     "what would a system look like that helped people keep up with increasingly complex information given that 
     there are reasonable disagreements about important facts?" "record fact-checking")

* Pincites
* Links in extension frame should load in main page
* Context trail (alignment and appearance of pro/con, counters, compounds)
* Better source UI: more distinct UI element, verify quote, read page with some library like newspaper for Source info. 
* User accounts, pages, notifications
* Equivalent/similar proposition voting, equivalent proposition justification combination
* Highlighting justification creator's counter or excerpt under proposition.
* Reordering compound proposition atoms
* Can't delete tags on create proposition page
* mobile two-column layout
* examine link page


* Justification model...
  * anchoring justifications/justification appearances?
* Tooling: access my recent stuff while researching online (default to user recent actions in extension)

* React-Native WebView onMessage/postMessage bug: https://hackernoon.com/fixing-react-native-webviews-postmessage-for-ios-bf1961065b09

* Difference between SourceExcerpts and Target/Anchors?
  - Target/Anchors generalize SourceExcerpts to be from any one source with multiple anchors of any media
  - SourceExcerpts force the thing into a single media type; whereas a source might appear in multiple media
  - SourceExcerptParaphrase: Source, Excerpt (target), and Paraphrase
    - So rather than saying it is a writ, we could just start out with a source of a website
    - We could always backfill Sources later for SourceExcerpts
  - possible migration:
    - convert all writ_quote justifications to compounds having a single atom
    - writs => sources
    - move source_id from source_excerpt to source_excerpt_paraphrases
    - remove source excerpt type; excerpts all come from sources; anchors determine media type.
    - convert writ_quote urls to website targets and anchor each using the quote as exact_text 
* Simplify SourceExcerpts by showing type based upon browser extension target
* Simplify UI around clauses by allowing reordering of and addition of proposition/excerpt (two buttons or a popup button with two menu options) clause at end. 
* Hide justification type select

* When someone highlights something on the web, they might want to:
  - Capture something that is being said (create a proposition and appearance)
    - In order to:
      - prove something else (justify a new proposition with this proposition)
      - disprove it (create a counter-justification to this proposition) (Argument, Counter-Argument, Reply-Counter-Argument?)
      - record the speaker
      - support it (create an argument)
  - Prove or disprove something else (create a justification based upon this source of a new proposition)
    - Do they need to paraphrase the source excerpt? (create a proposition?)

* Hemang meeting:
 - Make language simpler: propositions, justifications
 - Flesh out entire example using prototyping tool that allows showing entire example with all necessary actions
 - Use an example that has more clear evidence and a right/wrong outcome

* Instead of augmenting writquotes with targets, should I be creating SourceExcerpts?
 - The target should be a Website(Appearance)Target?
 - targets are a replacement for URLs
 - TextQuote Anchor's .exact property replaces WritQuote.quoteText
 - So should this be the beginning of a general SourceExcerpt?
 - If I don't, how to handle the mix of urls and targets?

* places where I need to read targets:
 - urlsDao.readUrlsByWritQuoteIdForRootPropositionId
 - readUrlsForWritQuoteId

# RichTextEditors
* If we want to build towards providing a tool for authors to put on their sites, then we don't want to rely on any RTE
  entities or whatever for support/arguments.  We want a solution that we can add on top of existing platforms.

* Rich Text Editors:
  * http://prosemirror.net/
  * https://quilljs.com/docs/quickstart/
  * DraftJS
    * https://github.com/sstur/react-rte
    * https://github.com/jpuri/react-draft-wysiwyg
    * https://www.draft-js-plugins.com/
    * https://github.com/jpuri/draftjs-utils
* Visit recent activity, click a proposition, delete it, renavigate to recent activity, errors I think because the item
  is still in the widget state
* Recent justifications are the most important activity.  Remove others, or at least move them to top.


* Use JSON Schema instead of Joi? https://www.npmjs.com/package/ajv


* Support statement justifications
  * Missing
    * StatementUsagesPage
    * Search persorgs
    * Recent statements (dedupe with inner statements/propositions?)
  Ideas:
    * limit suggestions to 20, configurable
    * contextTrailItems unhandled by JustificationCard.js
    * replace propositionTagVote and api.tagProposition (& friends) with root target versions
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
