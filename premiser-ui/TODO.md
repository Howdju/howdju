# Howdju UI TODO
## MVP

* With long quote submission, citation input overlaps with quote input...
* autocomplete of citation appears while in URL field
* Do login error messages work? (ui.js)

### Features
    
* How will I bring over compound justifications?
  * Maybe look at examples from the old site and see if I can recreate them?
  * Could it be the List justification type?
    * Users vote for inclusion/exclusion in the list
    * No, because each compound argument has a 'theme' that voting would screw up.
  * Could be Snippet type, where user puts several statements in a sentence with supporting words.
    <statement 1> and <statement 2>, but <statement 3>
  
* Relations
  * Show statements justified by statement
  * show statements justified by basis
  * Justifications countered by statement

* Can counter justification with same statement as basis for target justification
* Add linting 
  * https://www.npmjs.com/package/eslint-plugin-lodash-fp

* Jobs (justification score)
* favicon
* Stop API and load statement justifications page.  State shows didFail: true, but UI doesn't reflect it
  
* Statement example: height of the capitol building limit DC
  
### Feedback
* Error reporting
  * feedback script; 
  * unhandled error reporting
  * ensure that log level in prod is at least debug

### Bugs/stability
* replace regex with path-to-regexp
* What happens if we justify a statement with itself?
* Figure out if the site works in Firefox
* Test with mobile device
* flag rehydrate after a timeout (sometimes rehydrate not flagged and API calls hang)
  * Sometimes verification becomes unresponsive UNTIL you open the nav drawer...

### Misc.
* UI Build
  * ensure that CSS goes to external sheet
  * ensure that google fonts go to external link?

* Why do I have PostCSS in my project?


## 0.2

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
* Do I check return values for delete dao methods and throw NotFoundError when it was missing?

### Editors
* Separate JustificationWithCounters into JustificationCard and JustificationTree/CounteredJustification/Argument
  * challenge of card having buttons to create counter
  
### Features
* tagging
  * Home page tag cloud
* Implement full model constraints in services
  * don't let a user edit their own entities when they are older than a certain age
* JustificationBasisType.List 
  * A list of purported examples of something with links to prove their existence
  * [{text, urls}, ...]
* warn if they try and navigate away after entering text
* Add delete statement/justification confirmation (or better, undo)
* Author of quote
* Make URLs (or CitationUrls) voteable.
  * Users can always add new URLs
  * Deleting URLs follow the normal rules (if other users have interacted, or grace period is up)
  * Votes determine order of URLs
* Justification bases
  * Button to show image/video URL in-context
  * JustificationBasisType.IMAGE
  * JustificationBasisType.VIDEO
* Analyze sources
  * See list of all domains cited; search cited domains.
  * See citations (quotes?) and/or citations supported by domain name
  * How to evaluate the truthiness of a quote from a URL
    * How to tell when text on a page is a quotation rather than a direct statement
      * X said
      * quotation marks
* Recent votes: see what statement justifications look like when limited to a time period, either pre-selected time periods or according to the 'most recent activity' however recent that most recent activity is
* Main search:
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

### Flair
* Rotate placeholder of mainSearch to be popular statements: howdju know that "blah blah blah"
* Update slug of path when updating statement on StatementJustificationsPage
* Adding maxlength to StatementTextAutocompleter on create justification dialog creates horizontal scrollbar
* Disable context menu(s) when deleting something, like a statement or justification
* Add progress and disabled to vote buttons
  * Don't slide/hide the vote actions until the vote has successfully responded

### Refactoring/stability
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
* Hover statement when scrolling through its justifications
  * Get statement to stay in place and float above justifications? Or maybe collapse to something 
    smaller, but that lets you see the statement still as you scroll.  maybe combine with header.

### UI
* Counter-justification creation:
  * When creating a counter-justification, if the new justification will be at the top, the new justification should
    replace the editor.  E.g., when there are no counter justifications.
  * When created counter-justification is initially inserted, this may not be the same location it appears on a full
     page reload.

### Product/Modeling ideas
* Disjustifications of a statement are counters to a justification using that statement
  
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