# Howdju UI TODO
  
* It would be great to figure out how to ensure that the app doesn't freeze

* Example where we would want to allow helper conjunctions, but to zone in on the statements:
  "The tea party shouldn't be labeled racist because some members are racist"
  * Except that [Most Beatles fans would condemn a rapist]
    whereas [Few Tea Partiers have condemned racism]
  * Same justification idea as (equivalent justifications? Tag with logical fallacy?):
    * Muslim leaders decry extremism, whereas alt-right leaders tolerate or even instigate racism
    * on statement 1070 (http://localhost:3000/s/1070/racist-members-of-the-alt-right-are-just-like-extremist-adherants-to-islam-you-cant-denounce-the-entire-group-because-of-actions-of-the-few)
  * coordinating conjunctions: and, but, for, nor, or, so, and yet
  * subordinating conjunctions: after, although, as, as if, because, before, even if, even though, if, if only, 
    rather than, since, that, though, unless, until, when, where, whereas, wherever, whether, which, and while
* Home page
  * Featured perspectives
    * height of the capitol building limit DC
    * Hillary's emails
  * About
* Deep link to justification on statement page
  * Scroll to anchor after justifications load
* Remove production.env from git
   * change premiser_api password

### Features
* Jobs (justification score)
* Stop API and load statement justifications page.  State shows didFail: true, but UI doesn't reflect it

### Marketing
* Google analytics

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

### Misc.
* UI Build
  * ensure that CSS goes to external sheet
  * ensure that google fonts go to external link?

* Why do I have PostCSS in my project?


## Tooling
* Consider copying this
  * https://github.com/react-boilerplate/react-boilerplate
* https://flow.org/
* Update webpack 3
  * scope hoisting and magic comments for chunks
  * https://github.com/webpack/webpack/releases
* Add linting 
  * https://www.npmjs.com/package/eslint-plugin-lodash-fp


## 0.2 (others can use it)

## Update release (I can use it and show it to people)
* When opening many recent statements to delete them, the last one wouldn't load; chrome said "waiting for available socket"
* Improve not found page

### Info
* Who created (really need a profile page first)
  * Change schema to creator instead of creatorId?

* WHen normalizing text, replace periods and quotations with nothing (now is space)
* Need to add a continuation token forwards too, so that when the recents page is reloaded, we can request anything new.
  * When there is a backwards continuation token, we don't request the initial entities, but can request new ones.
  * Then can remove sortBy from recent widgets reducer

* Compound justifications must be snippet justifications.  Fee-form text entered by user (limit length or number of sentences?)
  and then marked up just like it woudl be off-site
* Tagging
  
* Add statement.justifications generally, like I did with perspective.statement.justifications?
  * Rename page to CreateStatementPage?
* Tools for editing faster
  * Recent statements
  * Tagging
  * in-context creation
* Add "modal" votes: I think it's true/false but I don't konw the reason and "I don't know"
* Can users only vote on citations?  And not on statements?  Or at least: analytics about statements you support for which
  you don't yet support any citations
* Checkbox next to everything you might include in a perspective so that you can collect them and then create one.
* More referential integrity before returning (like service.readMoreJustifications

### Social login
* https://developers.facebook.com/docs/facebook-login/web

### Feedback
* Error reporting
  * feedback script
  * unhandled error reporting
  * ensure that log level in prod is at least debug
  * request ID and cookie ID
  
* Autosubmit cited pages to archive.org

* Add site sections
  * ToS/Privacy
    * harassing/people's right to privacy
    * May not automate use of system
  * About
  * Contact
  
* All statements page with URL pagination for web crawlers
  * Or just do site map for crawlers
* All domains page
  * When click on one, show justifications or show rootStatements?
  
* Advanced search
  * find statements supported/opposed by a domain
* Source/author truthyness heat map
* User profile
* User account (preferences, notifications, email, password)

### Home page ideas
* Priority
  * recently created statements (recently active statements?),
  * Featured perspectives
  * Snapmunk has a nice three-column design
  * all statement tags cloud
  * Controversial statements
  * Active pages (cited pages with some measure of activity based upon the justifications/statements)
    * Provides a way for a user to find interesting content with the extension (requires extension)

* Home page: suggested consumption (what the system thinks the user might like to see, read, learn), 
  suggested creation (what the user might be able to contribute to or decide or play the game), 
  and transactional notifications (interactions with things the user has done or notifications that the user has explicitly 
  configured)
* What has changed since the user last came to the site that would be interesting to the user
  * counters to justifications the user has verified (transactional?)
  * statements with topics of interest to the user
  * citations from sources or authors that interest the user
* Where would a user's contributions be most useful?
  * Controversial statements
  * One-sided justifications
  * Statements with no justifications
* Recently analyzed pages (bringing in the page's statements in order to evaluate them)
  * Do we need bare citations so that we can argue the truth of the quoted text?
* Recently cited pages (using the page to make an argument)
* Recent (statements, verifications)
* Example statements
* Topics of interest to user
  * Activity on statements relevant to the user 

### Bugs
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
  * Include type conversion in validation somehow?  toNumber(statementId), e.g.
* Reuse code between client/server (Use same javascript syntax in client/server.)  
  * https://webpack.github.io/docs/commonjs.html
* Toasts are under dialog
* Can't shift-tab out of FocusContainer
  * Try upgrading react-md first, then fix fork
* Autocomplete
  * Does not appear above dialog
    * [Fix in react-md 1.1](https://github.com/mlaursen/react-md/issues/232)
  * fork react-md and add features like [react-autocomplete](https://github.com/reactjs/react-autocomplete)
* If there's a parse error in route.js, then we get an error that headers cant be set after they are sent.
* Do I check return values for delete dao methods and throw EntityNotFoundError when it was missing?

### Editors
* Separate JustificationWithCounters into JustificationCard and JustificationTree/CounteredJustification/Argument
  * challenge of card having buttons to create counter
  
### Features
* Add refinement/intervening statement justification (justification drop-down item creating new statement justifying same statement and justified by this justification)
* Hyperlink statement text to drill-down to statement
* Design statement compounds to be text-like instead of paper/card blocks.  This should mirror or relate to the 
  appearance of how the browser extension marks up text on a page - for continuity and for education.
* When create statement and redirected to login and return information is gone.
* Schema.org
  * https://schema.org/ClaimReview
  * https://developers.google.com/search/docs/data-types/factcheck (multiple fact checks on a page)
* Relations
  * Show statements justified by statement
  * show statements justified by basis
  * Justifications countered by statement
* JustificationTypes
  * List (votes for inclusion/exclusion)
    * A list of purported examples of something with links to prove their existence
    * [{text, urls}, ...]
  * Argument (statements connected with joiner words: "or", "because", "then", "therefore", "if")
  * Math/formula/calculation: 
    * basic math expression that result in a number
    * Spreadsheet style data
    * Cite scrapable/tabular data?
  * MEDIA (Image/Video) (how handle editing to add higher-resolution images?)
    * Button to show image/video URL in-context
* tagging
  * Home page tag cloud
* Implement full model constraints in services
  * don't let a user edit their own entities when they are older than a certain age (really this is to prevent 
    anyone from having seen it; so should we track views instead?)
* warn if they try and navigate away after entering text
* Add delete statement/justification confirmation (or better, undo)
* Author of quote
* Make URLs (or CitationUrls) voteable.
  * Users can always add new URLs
  * Deleting URLs follow the normal rules (if other users have interacted, or grace period is up)
  * Votes determine order of URLs
* Analyze sources
  * See list of all domains cited; search cited domains.
  * See citations (quotes?) and/or citations supported by domain name
  * How to evaluate the truthiness of a quote from a URL
    * How to tell when text on a page is a quotation rather than a direct statement
      * X said
      * quotation marks
* Recent votes: see what statement justifications look like when limited to a time period, either pre-selected time periods or according to the 'most recent activity' however recent that most recent activity is
* Add facets to main search:
  * citation text
  * url
  * author
  * tags
* Disable (with help text explaining why disabled) context menu items based upon permissions/ability to do the action
* Allow collapsing counter justifications
* User registration
  * Change email, password, password reset
* Timeout authentication
* Location tags for statements
* Relation between counter to statement-based justification and the statement.  Should it be shown (suggested?) as 
  a disjustification on that statement?

* Add messages for when cannot edit and why
* When statements or citations or citation references conflict, offer to merge them somehow?
* Add time grade period checks to entity update methods

### Improvements
* replace regex with path-to-regexp
* Client validation
  * http://redux-form.com/6.8.0/docs/GettingStarted.md/
* Change submit button message to "create justification" when statement exists
  * Add link to statement when statement exists
* Difficult to distinguish citationReference having only citation.text from statement justification
* Show more error messages, such as OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT
* Api
  * cancel autocomplete upon submit (add autocomplete keys to submit?).
  * Move query params into axios parameters
  * Move schema denormalization to entities
* simplify reducer by merging all payload.entities?
  * Or (?): reducers.entities if we just know which entities are returned from which success actions, 
    we can automatically respond
* Search for payload.entities and find a way to factor out all these calls getting particular entities from the API results
  * Or should we not be normalizing from API?  Should we normalize in reducer?
  * Change this for autocomplete fetches in entities
* Delete citation reference URL right button is misaligned
* Support [pg prepared statements](https://node-postgres.com/features/queries#prepared-statements)  
* Create indices in postgres

### ML Support
* Record raw statement/citation text entered before normalized.  Keep this on a short time-scale

### Flair
* Move login status/logout to header
* Add different color bottom bar to main search
* Rotate placeholder of mainSearch to be popular statements: howdju know that "blah blah blah"
* Update slug of path when updating statement on StatementJustificationsPage
* Adding maxlength to StatementTextAutocompleter on create justification dialog creates horizontal scrollbar
* Disable context menu(s) when deleting something, like a statement or justification
* Add progress and disabled to vote buttons
  * Don't slide/hide the vote actions until the vote has successfully responded
* EditStatementCitationPage: can I move focus to basis component when first showing them?

### Refactoring/stability
* When an error occurs in a saga that transitioned the page (e.g. remove the default value of statementCompounds in
  the entities reducer and then create a statement justification, causing a transition to the statement justifications
  page), the app ends up in an inconsistent state that doesn't go away.  So do all saga workers need to be in a try/catch?
* Refactor tests to use helpers to cut down on setup noise
* Immutable refactor
  * [React App best practices](https://tonyhb.gitbooks.io/redux-without-profanity/content/transforming_state_per_component.html)
* rename justificationsByRootStatementId to rootJustificationsByRootStatementId?
* Clone normalizr and add capability to set prototype of objects generated by a schema
  * Move logic from models.js into prototypes
* Why store statement autocomplete suggestions in redux?  They are transient; just make them state
  * Or somehow reset them, like navigating away from page

#### Sagas
* Would like actions issued for all events, for traceability (sometimes now with `call`s, an action is skipped)
* Would like sagas to be testable, so few if any `yield*`s, which tightly couple the caller and callee
  * [testing `fork` (createMockTask)](https://redux-saga.js.org/docs/advanced/TaskCancellation.html)

### UX
* Statement justification drilling down
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
* Should disjustifications be statement only (forces ML-learnable negation?)?
* Periods at the end of statements?
* I'm worried about statement text collision, particularly with counters, which are likely to depend on context a lot
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
 * https://github.com/mattkrick/redux-optimistic-ui
* Time travel to see what libraries made app large
  * Figure out how to minimize lodash import
* Deploy to S3
  * HTTPS (NGINX?)
  * Cache index.html?
  * cdn.premiser.co?
  * [Invalidation vs. versioning](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
* Rename justification to newJustification in STATEMENT_JUSTIFICATION editEntity
* https://github.com/babel/babel-loader#babel-is-injecting-helpers-into-each-file-and-bloating-my-code
* Change to [Preact](https://preactjs.com/) (smaller)? ([switch](https://preactjs.com/guide/switching-to-preact))

### Tooling
* Local fonts for development
  * https://shellmonger.com/2016/01/22/working-with-fonts-with-webpack/

### Flair
* Favicon versions
  * https://github.com/audreyr/favicon-cheat-sheet
  * https://realfavicongenerator.net/

## Maybe
* https://prerender.io/

### Performance
* [Resource hints](https://github.com/jantimon/resource-hints-webpack-plugin)
  * [faster](https://hackernoon.com/10-things-i-learned-making-the-fastest-site-in-the-world-18a0e1cdf4a7)
  * https://github.com/brillout/awesome-react-components#performance
* [selectors](https://github.com/reactjs/reselect) (memoization of deriving from state)
  * http://redux.js.org/docs/recipes/ComputingDerivedData.html
* SSR
  * [Redux SSR](http://redux.js.org/docs/recipes/ServerRendering.html)
* [react-router-redux](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux)?
* Ensure Redux store preserved between hot reloads
  * http://stackoverflow.com/a/34697765/39396
* Drag-n-drop
  * [react-dnd](https://github.com/react-dnd/react-dnd)
* [normalizr with immutable](https://github.com/mschipperheyn/normalizr-immutable)?
* Plugins
  * [favicons](https://github.com/jantimon/favicons-webpack-plugin)
  * [Launch browser](https://github.com/1337programming/webpack-browser-plugin)

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
* [Obfuscate auth](https://github.com/rt2zz/redux-persist-transform-compress)
* [redux-persist-migrate](https://github.com/wildlifela/redux-persist-migrate)
* [Storage](https://github.com/localForage/localForage)

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
