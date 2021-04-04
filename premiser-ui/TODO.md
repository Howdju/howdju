# Howdju UI TODO

## Reboot

- Housekeeping
  - Update webpack 3.11.0 -> 5.30.0
  - update sentry
  - Upgrade postgres
- Possible upgrades
  - Upgrade React/react-md?
- New directions
  - AppSync?
  - Semantic search?

## Current plan

### STS track
- Export part of wikipedia
- Create a system that lets you search for sentences semantically similar to
  an input sentence 
- Train on wikipedia edits?

### Browser plugin track
- Research Dynamo
- Define API v2
- Finalize data model
  - What will people vote on?
- Translate existing data
- Write plugin
- Rewrite web app

* Anchoring algorithm
  * If can find single target using selector (CSS or XPath), then done
  * If can find single target using plain text, then done
  * If can find single target using semantic search, then done (notify of rewording)
  * Mark anchor as unvalidated and notify interested persons

## Other Issues

* Justification scoring: dot product of user group membership weight vector
  and the justification group vote sum vector

* Do not erase justification when not logged in!

* Was able to create a tag with a white-space-only name
* Can search-justifications with no filters
* Fetch more on search justifications doesn't seem to fetch more

* Right now returning '#' for entity links that lack and ID.  Should we also
  change the components so that they aren't clickable?

* Why do I have PostCSS in my project?
  
* Improve not found page

* Dynamo (pricing of triggered events?)
  * https://aws.amazon.com/dynamodb/pricing/
  * table item size less than 1KiB?

* Update redux-persist?
  * https://github.com/rt2zz/redux-persist/

## Fall 2017 TODO
* Show when a user agrees/disagrees with a proposition
  * (readPropositionJustificationVotesByPropositionId: join justifications having rootPropositionId with their propositions and votes on that proposition)
* Add justified count to root proposition
* Add recent proposition recommendations to create proposition compound based justification
* Add "create justification" prompt below justifications
* Basic grouping of users
  * How to know whether a user agrees or disagrees with a proposition to show them "your" ranking of justifications vs.
    "their" ranking when they first view a proposition?  Really need four things: justifications from your cluster in support,
    justifications from your cluster opposing, representation of justifications from other clusters in support, justifications
    from other clusters opposing 
  
## what to do next?
* example-based justifications
  * Would need a new vote type for scoring examples as in or out of

* Should also add stage LOG_LEVEL to allow modifying on the fly without a publish
  * Support lambda function "environments" by snake-casing lambda alias and checking env. vars with that prefix first

* bookmarklet fails on some pages with restrictive CSP (e.g., quora, archive.org)

* Register howdju.org and howdju.co

* Proposition autocomplete results overwrote tags
  * Somehow strangely reappears when submitting counter-justification!?
  * Editing proposition disappears tags
  * Should not overwrite an entities properties if they aren't present on the returned entity
* When added counter-justification, got React non-unique Key error

* Firefox shoots off an autocomplete request for every character typed
  * FF: can't downvote tag
* Race condition of multiple votes being sent (disable tagging/untagging after click)

* Rename makeNewProposition etc. to makeProposition (except makeNewJustification)
* Does hitting API /propositions result in an error because sorts is required?  It shouldn't be required; have default sorts and limit

* Potential big priorities
  * index database
  * Discovery
    * Show main search domains as card with quote count, justification count, and proposition count
      * Link to searches for each of those
  * version API
  * Rich context
    * When viewing proposition, show counter-justifications to any justifications using it
    * Show justification count by polarity for proposition
    * Show percentage of justifications (or root justifications?) that are source-based
    * When counter-justifications are collapsed, show: Counter justifications (8)
  * Multi-user
    * Share auth between tabs
    * Social login
    * Terms, privacy, contact form
    * Rate limiting by account, IP
    * Flag offensive functionality
  * Can users add URLs to justifications that aren't their's? Voting on URLs to get rid of bad ones?
  * Business model: private content
    * Anonymous posting (what do I do the first time someone anonymously uses a racial slur?)
      * Empower users with filters
        1) hide content without verified account activity
        2) hide potentially offensive content (allow them to hide by degrees of certainty of offensiveness?)
        3) exception for activity from verified accounts
    * Creation/deletion as existence of a creation action vs. row in table
      * So that two users can create the same thing with different visibility settings
  * semantically equivalent propositions (voting, display, automatic detection)
    * Negations (voting, display, automatic detection)
  * Contextual tool
    * Use FF sidebar somehow?  Is this standard with Chrome, too?
    * Create quotes
    * Show me
      * Show me important claims on this page
      * Show me contentious claims on this page
      * Show me disputed/inaccurate claims on this page
      * Show me other pages that make this claim
  * Somehow incorporate infinite scroll like on slate.com stories.  Either as a way to discover content on the feed
    or maybe as a way to go into proposition justifications?

* Store referrer when submitting justification?  Generally should match up with URL...
* Are 401s to login in FF showing up as errors in sentry?
      
* Need to remove entities from redux store when they are successfully deleted?

* pagination for search results

* Paraphrases don't show up in writQuote usages

* Justification actions don't appear while on mobile but desktop version

* Product
  * Credibility of sources
  * Real identity vs. reputation
  * Gamification
  * Interesting value-added features?
    * Links on page cited
      * links in quoted text (suggesting support for quoted text)

* To share dev
  * move out configuration
  * add tests
  * add CI
  
* Security
  * Add an HttpOnly, Secure cookie so that authentication can't be taken off site (no XSS can steal all the credentials
    necessary to make a change.  Keep the local storage token as that prevents CSRF - the attacker needs a script on teh page
    to read that.)
* Support hidden source maps?
  * https://docs.sentry.io/learn/cli/releases/#upload-source-maps

Improvements to propositions trail:
  * Confirm that trailPropositions are in fact parents?
    * Show some context like: supports..., opposes..., counters a justification of...
    
* Why does windowAware need to be pure=false?

* recent quotes: exclude those with empty quotes?

* Escape in new justification dialog is awful when I hit it accidentally and lose my form data
  * Don't lose form data.  Add clear button

* The "Use" in a justification basis compound having a single atom is duplicative of the "Use" for that atom.
* Redirecting from deleted proposition fails if the URL does not contain the same slug (i.e. when manually entering /s/123)
  * https://stackoverflow.com/a/39507279/39396

* Build UI into subfolder to prevent collisions while running locally and building for prod? 
  * local env has production sentry env?
     * This occurs when we deploy to production while serving dev.  The deployment replaces index.html

* While researching these old propositions, it's really annoying not to be able to know where the citations are hidden.
  * A tree view showing the primary sources in relation to the overall would be great.
  
* Command-clicking on tab navigates in current tab



* when scroll area is smaller than header smallchat doesnt reappear
  
* When updating lambda alias, return previous version
  * Configure S3 versions for UI?
* Don't use prod values as fall-backs in lambda env. vars.  Throw an error if a fall-back is missing.
  
* Is a Paraphrased citation equal to a citation-based justification?
  * Automatically create citation-based justification?
  
* Send raw API requests to S3 so that we have a log of actions taken, in case we decide to aggregate the data differently later?

* Paraphrases 
  * Recent paraphrases / search paraphrases by source excerpt type/ID
  * See usages of writ from paraphrase
  * Search paraphrases by url/url domain?
    * If I search justifications by writId/writQuoteId, do I get paraphrases using it?
  
  * We probably want to allow people to vote on the paraphrase/connection between a proposition and a source?
    * This could be by voting on the justification
  
  
* API_ROOT vs. API_HOST env. vars, shared API config between prod and pre-prod (right now I think pre-prod returns Bearer Authorization header for prod)

* randomly got this message: 'window.webkitStorageInfo' is deprecated. Please use 'navigator.webkitTemporaryStorage' or 'navigator.webkitPersistentStorage'


* Refactors
  * rename create to readOrCreate
  * replace impossible error with exhausted enum error
  * Review use of onTextInputKeyDown (if the purpose is to catch enter/escape, why limit it to text fields?)

* Don't persist isActive, Name, email identifiers etc. in local storage.  Only authtoken.  Obfuscate it.  Request other information upon page load
  and leave it in-memory
  * Do not track: don't use analytics.  Don't even load libraries.
  
* Setup cdn.howdju.com DNS/Cloudflare
  
* Safari OS X recent activity UI bugs
  * The Progresses don't hide
  * There is an annoying repetitive flash where a horizontal scroll bar appears and disappoears

Cat meeting design notes:
  * Proposition text larger
  * Remove "Justification", since is implied? (supporting/opposing)
  * Need a search magnifying icon
  * when click main search, change prompt to "type what you want to know about"
  * Paper clip tags to bookmark for later
  * Proposition non-negated, negated
  * Instead of hamburger, profile icon
  * Main search should also be for creating a justification.  Add suggestion to create
    on main search results page
  * Figure out a 'feed' of suggested content
    * How relates to 'notifications', which are more transactional?
    * Distinction is whether you can ignore the thing; if you ignore a thing, will somebody be 
      disappointed; is someone expecting you to respond?
  * How to deal with diverse content issue?  People might post about the best beer?
    * Stackoverflow approach: no opinions
      * But the multiple stackexchange concept has broadened the vision
    * Reddit approach: subreddits

* App cold load can be >10s

* Fade unhovered disapproved justifications
* Add icons to indicate justification vs. counter?
* Hover to explain Supports, Opposes, counters
* Recently viewed propositions, recently viewed tags, recent searches
* Somehow provide ability to roll back UI.  Either output current version of UI when updating or have a history somewhere

* What is my data backup strategy?  Should I switch to Aurora Postgres?
  
* pg native?
  * https://aws.amazon.com/blogs/compute/nodejs-packages-in-lambda/

* User signup
  * Redirect login to https, Terms, Share auth between tabs, Privileges, Points, Rate limiting
* Metrics: new users, daily active users (visit, vote, create)

1) Whats next / About page
  * Other stuff: documentation, document bookmarklet
  * Terms / Privacy
    * https://www.reddit.com/help/useragreement
2) Add citations, quotes, tags to main search (requires result type)

* Revealing levels
  * paragraph indicator - mouse-over and runs of text having annotations get underlines
    * click on the run of text and it pops-up a list of all paraphrases (ideally semantically equivalent clusters of paraphrases)
      along with status(es).  What statuses would be interesting? (number of justifications?)
    * Anyway, clicking on a paraphrase brings up...the justification usages or the supporting/opposing justifications?
  * Show: only mine, only people I follow, only verified users

* For local logger, color warning/error output to make it harder to miss?


## Bugs
* When create proposition and redirected to login and return information is gone.
* When two tabs are open and authentication changes in one, it doesn't propagate to other tabs
* iOS content blocker blocking google fonts
* Errors from safari iOS aren't going to sentry
* sentry errors not showing up for howdju.com?
* Start editing citation on proposition justifications page; navigate away; use back button, is still editing.  Bug? Feature?
* Creating an opposing proposition-based justification after entering the proposition manually didn't create it!
* When logout, refresh page (votes should go away)?
* No login toast in prod
### More bugs
* With slow connection, click create justification multiple times
  * looks like multiple justifications are made
  * It is possible for several requests submitted around the same time to pass validations
    and then get to creation of things that violate constraints.  This is hard to fix without
    transactions, I think.
  * One fix could be to reconcile on a schedule well enough after the creation so that there won't be
    the possibility of conflicting creation occurring.
  * Would need to program as if constraint-violating models could occur, and have some method for
    reconciling those results on the fly until the scheduled reconciliation occurs, such as ordering
    by created date and taking the earliest
* Validation belongs in route.js, I think
  * Include type conversion in validation somehow?  toNumber(propositionId), e.g.
* Toasts are under dialog
* Can't shift-tab out of FocusContainer
  * Try upgrading react-md first, then fix fork
* Autocomplete
  * Does not appear above dialog
    * [Fix in react-md 1.1](https://github.com/mlaursen/react-md/issues/232)
  * fork react-md and add features like [react-autocomplete](https://github.com/reactjs/react-autocomplete)
* If there's a parse error in route.js, then we get an error that headers cant be set after they are sent.
* Do I check return values for delete dao methods and throw EntityNotFoundError when it was missing?

# Milestones

* I can use the system
  * Quote capture mechanics (capture Xpath, surrounding text, make it source-specific: title instead of description; capture vs. request later for author, date)
    * Bookmarklet should import script
  * Two bookmarklet capabilities:
    - Capture quote justification (do I ask them to paraphrase the quote?)
    - target quote paraphrase
  * Collect source author, date, publication, article title
* I can share the system
  * Collapse counter justifications
    * Show all
    * Show approved
    * Show recommended (machine learning score)
    * Hide disapproved
    * Hide all
  * Sort justifications/counters by
    * rank
    * created
    * updated
    * checkbox: show approved first
    * checkbox: show disapproved last
  * filter justifications/counters by
    * mine
    * people I follow
    * specific user
    * verified users
    * all
    * contains text (input text)
    * not flagged as offensive/harassment/spam/illegal
      * except from verified users
  * Tags
    * paraphrases and quotes are amenable to tagging because they have context.  
      propositions might be amenable, depending on how specifically they are written.
      Justification text could be too, depending on how specifically written and 
      particularly if the tagging is adjusted for the context: i.e. more likely when
      the proposition justified implicates a similar context.
* Others can use the system
  * Semantic equivalence
    * Vote on equivalence?
  * TODO version API (add path parameter and add version to routing)
* On-page analysis
  * Start with Twitter?
* Improve the system
  * SEO
    * Server-side rendering
  * Gamification
  
* Other devs can contribute
  * Dev environment
    * Continuous delivery
      * Jenkins/Spot-instances
        * https://jenkins.io/blog/2016/06/10/save-costs-with-ec2-spot-fleet/
        * https://d0.awsstatic.com/whitepapers/DevOps/Jenkins_on_AWS.pdf
        * https://aws.amazon.com/blogs/devops/set-up-a-build-pipeline-with-jenkins-and-amazon-ecs/
        * https://aws.amazon.com/getting-started/projects/setup-jenkins-build-server/
    * Automated testing (browserstack?)
      * http://nightwatchjs.org/
  * Unit testing

* logo and main search alignment is off

* Start with twitter login/integration
  * Use twitter identity model: verification but not necessarily tied to real identity
  * Don't kill myself about getting highlighting arbitrary text on a page...?

* fill out carl.gieringer normal account

## Stuff not necessary before switch

* Featured Perspectives are scrunched on mobile
* Clicking on proposition of Justification in JustificationCard should go to justification not basis proposition?

* Cards rich information: who created, number of justifications or justifications based upon
  * perspective: whose!?
  * perspective: see all justifications

* Deep link to justification on proposition page
  * Scroll to anchor after justifications load

### Features
* Stop API and load proposition justifications page.  State shows didFail: true, but UI doesn't reflect it

### Bugs/stability
* Testing
  * Mobile Safari
  * Mobile Chrome
  * Firefox
* flag rehydrate after a timeout (sometimes rehydrate not flagged and API calls hang)
  * Sometimes verification becomes unresponsive UNTIL you open the nav drawer...
* Search TODO
* Fix tests
* Setup CI?


## Tooling
* Consider copying this
  * https://github.com/react-boilerplate/react-boilerplate
* https://flow.org/

## 0.2 (others can use it)

* Mobile app
  * Can I use a webview to insert the extension javascript?
  * https://stackoverflow.com/a/13473498/39396
  * https://stackoverflow.com/a/45228364/39396

* Bot/spam/abuse detection
  * IP rate limiting
  * account rate limiting (sharing account)
  
## Update release (I can use it and show it to people)
* When opening many recent propositions to delete them, the last one wouldn't load; chrome said "waiting for available socket"

### Info
* Who created (really need a profile page first)
  * Change schema to creator.id (with related user object too) instead of creatorId?

* When normalizing text, replace periods and quotations with nothing (now is space)
* Need to add a continuation token forwards too, so that when the recents page is reloaded, we can request anything new.
  * When there is a backwards continuation token, we don't request the initial entities, but can request new ones.
  * Then can remove sortBy from recent widgets reducer
  
* Add proposition.justifications generally, like I did with perspective.proposition.justifications?
  * Rename page to CreatePropositionPage?
* Tools for editing faster
  * Recent propositions
  * Tagging
  * in-context creation
* Add "modal logic" votes?: I think it's true/false but I don't know the reason and "I don't know"
  * Generally allow a person to vote how they think regardless of justifications?  Would help use get
    information about beliefs and user interests
  * Can users only vote on justifications?  And not on propositions?  Or at least: analytics about propositions you support for which
    you don't yet support any justifications
* More referential integrity before returning (like service.readMoreJustifications

### Social login
* https://developers.facebook.com/docs/facebook-login/web
  
* Autosubmit cited pages to archive.org

* Add site sections
  * ToS/Privacy
    * harassing/people's right to privacy
    * May not automate use of system
  * About
  * Contact
  
* All propositions page with URL pagination for web crawlers
  * Or just do site map for crawlers
* All domains page
  * When click on one, show justifications or show rootPropositions?
  
* Advanced search
  * find propositions supported/opposed by a domain
* Source/author truthyness heat map
* User profile
* User account (preferences, notifications, email, password)

### Home page ideas
* Priority
  * Recently active propositions
  * Featured perspectives
  * Snapmunk has a nice three-column design
  * all proposition tags cloud
  * Controversial propositions
  * Active pages (cited pages with some measure of activity based upon the justifications/propositions)
    * Provides a way for a user to find interesting content with the extension (requires extension)

* Home page: suggested consumption (what the system thinks the user might like to see, read, learn), 
  suggested creation (what the user might be able to contribute to or decide or play the game), 
  and transactional notifications (interactions with things the user has done or notifications that the user has explicitly 
  configured)
* What has changed since the user last came to the site that would be interesting to the user
  * counters to justifications the user has verified (transactional?)
  * propositions with topics of interest to the user
  * citations from sources or authors that interest the user
* Where would a user's contributions be most useful?
  * Controversial propositions
  * One-sided justifications
  * Propositions with no justifications
* Recently analyzed pages (bringing in the page's propositions in order to evaluate them)
  * Do we need bare citations so that we can argue the truth of the quoted text?
* Recently cited pages (using the page to make an argument)
* Recent (propositions, verifications)
* Example propositions
* Topics of interest to user
  * Activity on propositions relevant to the user 
  
### Features
* Add refinement/intervening proposition justification (justification drop-down item creating new proposition justifying
  same proposition and justified by this justification)
* Schema.org
  * https://schema.org/ClaimReview
  * https://developers.google.com/search/docs/data-types/factcheck (multiple fact checks on a page)
* Relations
  * Show propositions justified by proposition
  * show propositions justified by basis
  * Justifications countered by proposition
* JustificationTypes
  * Example/List (votes for inclusion/exclusion)
    * A list of purported examples of something with links to prove their existence
    * [{text, urls}, ...]
  * Free text (with annotations))
  * Argument (propositions connected with joiner words: "or", "because", "then", "therefore", "if")
  * Math/formula/calculation: 
    * basic math expression that result in a number
    * Spreadsheet style data
    * Cite scrapable/tabular data?
  * MEDIA (Image/Video) (how handle editing to add higher-resolution images?)
    * Button to show image/video URL in-context
* Implement full model constraints in services
  * don't let a user edit their own entities when they are older than a certain age (really this is to prevent 
    anyone from having seen it; so should we track views instead?)
* warn if they try and navigate away after entering text
* Add delete proposition/justification confirmation (or better, undo)
* Speaker of quote
* Make URLs (or CitationUrls) voteable.
  * Users can always add new URLs
  * Deleting URLs follow the normal rules (if other users have interacted, or grace period is up)
  * Votes determine order of URLs
* Analyze sources
  * See list of all domains cited; search cited domains.
  * See citations (quotes?) and/or citations supported by domain name
  * How to evaluate the truthiness of a quote from a URL
    * How to tell when text on a page is quoting another source rather than a direct proposition
      * X said
      * quotation marks
* Recent votes: see what proposition justifications look like when limited to a time period, either pre-selected time 
  periods or according to the 'most recent activity' however recent that most recent activity is
* Add facets to main search:
  * citation text
  * url
  * author
  * tags
* Disable (with help text explaining why disabled) context menu items based upon permissions/ability to do the action
* User registration
  * Change email, password, password reset
* Location tags for propositions

* Add messages for when cannot edit and why
* When propositions or writs or writ quotes conflict, offer to merge them somehow?
* Add time grace period checks to entity update methods

### Improvements
* replace regex with path-to-regexp
* Client validation
  * http://redux-form.com/6.8.0/docs/GettingStarted.md/
* Change submit button message to "create justification" when proposition exists
  * Add link to proposition when proposition exists
* Show more error messages, such as OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT
* Api
  * Move query params into axios parameters
  * Move schema denormalization to entities
* Search for payload.entities and find a way to factor out all these calls getting particular entities from the API results
  * Or should we not be normalizing from API?  Should we normalize in reducer?
  * Change this for autocomplete fetches in entities
* Delete writ quote URL right button is misaligned
* Support [pg prepared statements](https://node-postgres.com/features/queries#prepared-statements)  
* Create indices in postgres

### ML Support
* Record raw statement/citation text entered before normalized.  Keep this on a short time-scale

### Flair
* If slug is not equal to current slug, change path
* Move login status/logout to header
* Add different color bottom bar to main search
* Rotate placeholder of mainSearch to be popular statements: howdju know that "blah blah blah"
* Update slug of path when updating statement on PropositionJustificationsPage
* Adding maxlength to PropositionTextAutocompleter on create justification dialog creates horizontal scrollbar
* Disable context menu(s) when deleting something, like a statement or justification
* Add progress and disabled to vote buttons
  * Don't slide/hide the vote actions until the vote has successfully responded
* EditPropositionCitationPage: can I move focus to basis component when first showing them?
* Escape key while focusing (i.e. arrow-keying onto it) autocomplete list should close it 
* Need loading indicator when using basis to create a justification (especially on lambda cold start, justification can be empty for awhile)

### Refactoring/stability
* When an error occurs in a saga that transitioned the page (e.g. remove the default value of statementCompounds in
  the entities reducer and then create a statement justification, causing a transition to the statement justifications
  page), the app ends up in an inconsistent state that doesn't go away.  So do all saga workers need to be in a try/catch?
* Refactor tests to use helpers to cut down on setup noise
* Immutable refactor
  * [React App best practices](https://tonyhb.gitbooks.io/redux-without-profanity/content/transforming_state_per_component.html)
* rename justificationsByRootPropositionId to rootJustificationsByRootPropositionId?
* Clone normalizr and add capability to set prototype of objects generated by a schema
  * Move logic from models.js into prototypes
* Why store statement autocomplete suggestions in redux?  They are transient; just make them state
  * Or somehow reset them, like navigating away from page
* Use JSON schema validation library
  * https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md

#### Sagas
* Would like actions issued for all events, for traceability (sometimes now with `call`s, an action is skipped)
* Would like sagas to be testable, so few if any `yield*`s, which tightly couple the caller and callee
  * [testing `fork` (createMockTask)](https://redux-saga.js.org/docs/advanced/TaskCancellation.html)

### UX
* Proposition justification drilling down
  * When goto statement, show hierarchy of statements above
  * show sub-justifications in-context
* Fix statement at top of viewport when scrolling through its justifications
  * Get statement to stay in place and float above justifications? Or maybe collapse to something 
    smaller, but that lets you see the statement still as you scroll.  maybe combine with header.

### UI
* Counter-justification creation:
  * When creating a counter-justification, if the new justification will be at the top, the new justification should
    replace the editor.  E.g., when there are no counter justifications.
  * When created counter-justification is initially inserted, this may not be the same location it appears on a full
     page reload.

### Product/Modeling ideas
* Periods at the end of statements?
* I'm worried about statement text collision, particularly with counter justifications, which are likely to depend on context a lot
  * Justifications on the statement might lack the proper context...
* Disjustifications of a statement are counters to a justification using that statement
* What happens if we justify a statement with itself?
  * Can counter justification with same statement as basis for target justification
* When someone verifies a justification with weak basis/weak justifications, ask them: "Are you sure? How do you know?" ?

  
### Bugs
* react-md autocomplete still shows when there are no results
* disverified negative justification causes horizontal scrollbar
  
### Error/Requirements
* Am I transitioning color on the verification icons?
* Require statement to be non-empty, or >3 words?

### Misc.
* CSS
  * React-MD recommends: https://github.com/postcss/autoprefixer
  * dppx
  * [vw/vh](https://www.w3.org/TR/css3-values/#viewport-relative-lengths)
  * https://github.com/jgranstrom/sass-extract-loader
  * reset.css alternative? https://necolas.github.io/normalize.css/
* Tap events
  * https://github.com/zilverline/react-tap-event-plugin
    * [Maybe not necessary?](https://www.reddit.com/r/reactjs/comments/4pe61k/why_do_we_need_reacttapeventplugin_in_our_projects/)
* [Form validation](http://redux-form.com/6.6.2/)
  * https://github.com/christianalfoni/formsy-react
  * https://github.com/vazco/uniforms
  * https://www.npmjs.com/package/react-validation
  * http://redux-form.com/
  * https://gist.github.com/mlaursen/641364cf6114692d470069c56c505880
* [Site map](https://support.google.com/webmasters/answer/183668?hl=en&ref_topic=4581190)


## Next-next
* Look for a UI framework that allows us to cancel touch events (so that they don't cause downstream hover events)
  * react-md relies upon onClick everywhere, and not onTouch*
* https://github.com/mattkrick/redux-optimistic-ui
* Time travel to see what libraries made app large
  * Figure out how to minimize lodash import
* Deploy to S3
  * cdn.premiser.co?
  * [Invalidation vs. versioning](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
* https://github.com/babel/babel-loader#babel-is-injecting-helpers-into-each-file-and-bloating-my-code
* Change to [Preact](https://preactjs.com/) (smaller)? ([switch](https://preactjs.com/guide/switching-to-preact))

### Flair
* Favicon versions
  * https://github.com/audreyr/favicon-cheat-sheet
  * https://realfavicongenerator.net/

## Maybe
* https://prerender.io/

## Bundle size
* Minimize react-md (don't use react-md-everything): 
  * https://react-md.mlaursen.com/customization/minimizing-bundle#minimizing-css-bundle-size
* Minimize lodash
  * https://www.npmjs.com/package/eslint-plugin-lodash-fp
  * https://www.npmjs.com/package/babel-plugin-lodash
  * https://github.com/lodash/lodash-webpack-plugin
* Use date-fns instead of moment?
  * https://date-fns.org/

### Performance
* https://developers.google.com/speed/pagespeed/insights/?url=howdju.com&tab=mobile
* https://tools.pingdom.com/#!/ek204K/howdju.com
* [Resource hints](https://github.com/jantimon/resource-hints-webpack-plugin)
  * [faster](https://hackernoon.com/10-things-i-learned-making-the-fastest-site-in-the-world-18a0e1cdf4a7)
  * https://github.com/brillout/awesome-react-components#performance
* [selectors](https://github.com/reactjs/reselect) (memoization of deriving from state)
  * http://redux.js.org/docs/recipes/ComputingDerivedData.html
* Server side rendering
  * [Redux server rendering](https://redux.js.org/recipes/server-rendering)
  * https://hackernoon.com/next-js-react-server-side-rendering-done-right-f9700078a3b6
* [react-router-redux](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux)?
* Ensure Redux store preserved between hot reloads
  * http://stackoverflow.com/a/34697765/39396
* Drag-n-drop
  * [react-dnd](https://github.com/react-dnd/react-dnd)
* [normalizr with immutable](https://github.com/mschipperheyn/normalizr-immutable)?
* Plugins
  * [favicons](https://github.com/jantimon/favicons-webpack-plugin)
  * [Launch browser](https://github.com/1337programming/webpack-browser-plugin)
* [Mobifying](https://www.html5rocks.com/en/mobile/mobifying/)
  * [Mobile Web App Best Practices](https://www.w3.org/TR/mwabp/)

## Done?
* HMR
  * [React Hot Module Reload](https://webpack.js.org/guides/hmr-react/)
  * [Hot Module Reload](https://medium.com/@rajaraodv/webpacks-hmr-react-hot-loader-the-missing-manual-232336dc0d96#.jct5ie33w)
    * [React Hot Loader](https://github.com/gaearon/react-hot-loader)
      * ([starter kits](https://github.com/gaearon/react-hot-loader/tree/master/docs#starter-kits))
      * [Migration to 3.0](https://github.com/gaearon/react-hot-loader/tree/master/docs#migration-to-30)
      * [commit showing transition to 3.0](https://github.com/gaearon/redux-devtools/commit/64f58b7010a1b2a71ad16716eb37ac1031f93915)
* breakpoints in source
  * erikaybar.name/webpack-source-maps-in-chrome/
  * https://webpack.js.org/guides/development/#source-maps
  * https://webpack.js.org/configuration/devtool/
  * https://webpack.js.org/guides/production-build/#source-maps
  * https://survivejs.com/webpack/building/source-maps/
* [React Router 4 Docs](https://reacttraining.com/react-router/web/example/basic)
* Redux
  * [redux-thunk](https://github.com/gaearon/redux-thunk) vs. [redux-saga](https://redux-saga.github.io/redux-saga/)
  * [redux-actions](https://github.com/acdlite/redux-actions)
  * [normilzr](https://github.com/paularmstrong/normalizr)
  * [ecosystem](http://redux.js.org/docs/introduction/Ecosystem.html)


## Cool 
* https://github.com/palmerhq/the-platform
* [Talk rich text editor](https://github.com/coralproject/talk/tree/master/plugins/talk-plugin-rich-text/client/components/rte)
* [Bundle Buddy helps optimize webpack bundles](https://github.com/samccone/bundle-buddy)
* Collaborative editor: https://github.com/philholden/redux-swarmlog
* https://github.com/mariusandra/kea
* https://github.com/awslabs/lambda-refarch-voteapp
* [CrowdIn Localization](https://crowdin.com/)
* [Google Factcheck](https://www.blog.google/products/search/fact-check-now-available-google-search-and-news-around-world/)
* [React virtualized](https://github.com/bvaughn/react-virtualized)
* [Map](https://github.com/alex3165/react-mapbox-gl)
* [Cool Card UI](https://codemyui.com/material-design-register-login-form/)
* https://github.com/Webhose/article-date-extractor
* https://www.npmjs.com/package/react-sticky
* https://github.com/ajbrock/Neural-Photo-Editor
* Community
  * https://github.com/discourse/discourse/blob/master/docs/INSTALL.md
* [Parallax](https://github.com/dixonandmoe/rellax) 
* [Scroll animation](https://github.com/michalsnik/aos)
* [Web designy repositories](https://github.com/ajlkn?tab=repositories)
* Improving redux persist
  * [Obfuscate auth](https://github.com/rt2zz/redux-persist-transform-compress)
  * [redux-persist-migrate](https://github.com/wildlifela/redux-persist-migrate)
  * [Storage](https://github.com/localForage/localForage)
* Open data sources
  * [Freebase data](https://developers.google.com/freebase/)
    * Migrated to Wikipedia?
    * Became [Google Knowledge Graph](https://developers.google.com/knowledge-graph/)?
  * [Public data sets?](https://www.google.com/publicdata/directory)
  * [Data containers](https://blog.okfn.org/2016/02/01/google-funds-frictionless-data-initiative-at-open-knowledge/)
* [SASS Variable to Javascript](https://github.com/nordnet/sass-variable-loader)
* [Node Postgres Migrations](https://www.npmjs.com/package/node-pg-migrate)
* [SFSafariViewController](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller)
* http://blog.mgechev.com/2017/01/30/implementing-dependency-injection-react-angular-element-injectors/
* Quality tools:
  * https://greenkeeper.io/
  * https://www.codacy.com/app/ranisalt/node-argon2/dashboard)
* [Transcribe audio](https://github.com/oTranscribe/oTranscribe)
* [React charts](https://mux.com/blog/so-we-redid-our-charts-part-ii-graphing-react-ing-and-maybe-a-little-crying/)
   * https://github.com/Radico/web/issues/673
   * https://uber.github.io/react-vis/
   * http://recharts.org/#/en-US/
   * https://formidable.com/open-source/victory/
* Material font: https://codepen.io/zavoloklom/pen/uqCsB
* https://atlassian.design/guidelines/product/components/checkboxes
  * https://atlaskit.atlassian.com/
* Reader mode/scraping, Boilerplate removal / readability mode:
  * https://github.com/mozilla/readability
  * https://github.com/codelucas/newspaper
  * https://github.com/keepcosmos/readability
  * https://github.com/luin/readability
  * [Scrapy web scraping](https://scrapy.readthedocs.io/en/latest/intro/overview.html)
  * https://github.com/chromium/dom-distiller
  * https://www.npmjs.com/package/distillery-js
  * https://www.crummy.com/software/BeautifulSoup/
    * https://www.crummy.com/software/BeautifulSoup/bs4/doc/
  * https://github.com/miso-belica/jusText (readme contains list of other projects)
* Code splitting
  * http://thejameskyle.com/react-loadable.html
* Image area selection
  * [imgAreaSelect](http://odyniec.net/projects/imgareaselect/) jQuery plugin
  * [JCrop](http://deepliquid.com/content/Jcrop.html) jQuery plugin
  * [JSCropperUI](http://www.defusion.org.uk/code/javascript-image-cropper-ui-using-prototype-scriptaculous/)?

## react-md bugs
  * Autocomplete lists cover toggle inputs
  * Autocompletes in dialogs are funky aligned
    * Glossary
      * anchor/belowAnchor - describe how the child will be introduced relative to the toggle
      * fixedTo - Child will be hidden if it goes outside this (by default it's the viewport)
      * toggle - The thing relative to which the layover displays the children
      * child - The thing(s) the layover is displaying
    
    * I think that the issue is that getBoundingClientRect is relative to viewport, while top/left
      are relative to first positioned ancestor.  So one solution would be to find the first positioned
      ancestor and subtract its getBoundingClientRect top/left from those calculated for the child.
      Maybe this is what _dialog and _inFixed are supposed to be doing?
      * _init fixes top/left based upon _dialog rect, but not if _dialog is falsy (fix this in
        _setContainer?)
      * This happens because _setContainer reaches the fixed md-dialog before it reaches its md-dialog-container
        I think md-dialog must be fixed, so I think the error is that it is not looking for md-dialog
    * Why doesn't it _positionChild within _fixateChild for md-dialog--centered? 
    * _init seems to get `left` correct, while positionChild does not
    
    * _handleTick and _initialFix
    * Layover._fixateChild: no _dialog even though in dialog
      * Takes first of fixed !md-layover-child or dialog
    * Ultimately, autocomplete needs to be attached to body, not parent?  Or can use overflow?
      * .md-dialog overflow: visible seems to work
  * main search autocomplete opening while editing statement below
    * autocomplete of citation appears while in URL field

## React-MD improvements
  * Escape when focusing autocomplete item should close autocomplete, return focus to autocomplete input?
