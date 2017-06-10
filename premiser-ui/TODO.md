# Howdju UI TODO
## MVP

* Add CitationTextAutocomplete

* Get StatementJustificationsPage to work with editors
  * Need to hide dialog on success
* Get rid of resetEditJustification in favor of something like beginning edit of new model?
  * replace resetEditJustification with beginEdit(makeNewJustification(...))

* Search for payload.entities and find a way to factor out all these calls getting particular entities from the API results
  * Or should we not be normalizing from API?  Should we normalize in reducer?
  * Change this for autocomplete fetches in entities

* deal with issue of citation.basis.entity vs. citation.basis.citationReference/.statement (how to know which one it is in an editor reducer?)

### Editors/Errors
* Update API and UI for editor errors
* Move JustificationWithCounter to use editor state
* change editEntity to editModel
  * cf. use of entityId

### Editors
* onClick, beginEdit(editorId, entity)
* editModel = cloneDeep(entity)
* property for entity type and id, so that can watch FETCH actions and show spinner?


### Features
    
* Show statements justified by statement

* bookmarklet

* Generate ID for counter justification editor and send that along with action to update

* Jobs (justification score)
* favicon
* Stop API and load statement justifications page.  State shows didFail: true, but UI doesn't reflect it
* Statements that differ by special chars or capitalization are treated as different (normalized text etc)

### Bugs/stability
* consolidateBasis of editor justification should happen in saga I think instead of in components
* Don't create empty URL from EditStatementJustificationPage!
* Simplify sagas like login/logout at bottom here: https://github.com/redux-saga/redux-saga/blob/master/docs/advanced/FutureActions.md
* Do I ever get failure actions in sagas?  Or are they always caught? And do I need to separate successAction from failureAction, or just use action.error?
* Reuse code between client/server (Use same javascript syntax in client/server.)  
  * https://webpack.github.io/docs/commonjs.html
* refactor sagas to use callApiForResource
* don't let a user edit their own entities when they are older than a certain age
* replace regex with path-to-regexp
* What happens if we justify a statement with itself?
* When creating statement and statement-based justification, typing in the justification basis statement text pops up the autocomplete for the statement
* Autocomplete
  * Does not appear above dialog
    * [Fix in react-md 1.1](https://github.com/mlaursen/react-md/issues/232)
  * reappears after clicking on search page (should only reappear upon typing)
  * branch react-md and add features like [react-autocomplete](https://github.com/reactjs/react-autocomplete)
* Why are IDs sometimes strings and sometimes ints?  (e.g., reducers.entities.DELETE_STATEMENT_SUCCESS)
* Figure out if the site works in Firefox
* Test with mobile device
* flag rehydrate after a timeout (sometimes rehydrate not flagged and API calls hang)
  * Sometimes verification becomes unresponsive UNTIL you open the nav drawer...
* can create two statements that only differ by apostrophe types (' vs. ’), probably whitespace, too.
* Can counter justification with same statement as basis for target justification
* Adding maxlength to StatementTextAutocompleter on create justification dialog creates horizontal scrollbar
* If there's a parse error in route.js, then we get an error that headers cant be set after they are sent.
* Change to using 500s with error keys that can be translated into UI messages

### Feedback
* Error reporting
  * feedback script; 
  * unhandled error reporting
  * ensure that log level in prod is at least debug

### Misc.
* UI Build
  * ensure that CSS goes to external sheet
  * ensure that google fonts go to external link?
* CitationReference update
  * If a users modifies a URL, do we edit it or create a new one?  I think treat them with value semantics, and create a new one
  * want to use the same schema for data submitted as data returned (why?) or at least same data shape
  * reducers.entities if we just know which entities are returned from which success actions, we can automatically respond

* Why do I have PostCSS in my project?

## 0.2

### Editors
* Don't revert edit until see success.  Show error message if failure
* When a citation reference update failure comes in, how do I know that it belongs to a particular editor?
* Separate JustificationWithCounters into JustificationCard and JustificationTree/CounteredJustification/Argument
  * challenge of card having buttons to create counter
* Can only delete bases (justifications/quotes) if other users haven't used them as bases
  * If super user deletes them, must cascade delete to justifications
  * Can't delete justifications if other users have voted or countered them
  * if delete justification, must delete counters

### Features
* Author of quote
* tagging
  * Home page tag cloud
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
* Hide/show context menu items based upon permissions/ability to do the action
* Allow collapsing counter justifications
* Change email, password, password reset
* Timeout authentication
* Loading flags (vs. just empty return from API)
* Statement example: height of the capitol building limit DC
* Add messages for when cannot edit and why
* When statements or citations or citation references conflict, offer to merge them somehow?
  
### Flair
  * Rotate placeholder of mainSearch to be popular statements: howdju know that "blah blah blah"

### Refactoring/stability
* Refactor tests to use helpers to cut down on setup noise
* Immutable refactor
  * [React App best practices](https://tonyhb.gitbooks.io/redux-without-profanity/content/transforming_state_per_component.html)
* rename justificationsByRootStatementId to rootJustificationsByRootStatementId?
* add rootStatement as a schema property of justifications?
* simplify reducer by merging all payload.entities?
* Clone normalizr and add capability to set prototype of objects generated by a schema
  * Move logic from models.js into prototypes
* Why store statement autocomplete suggestions in redux?  They are transient; just make them state
  * Or somehow reset them, like navigating away from page
* Error codes from API should be allowed per-entity, kind of like normalizer

### UX
* Allow creating multiple counter-justifications at a time
* Statement justification drilling down
  * link to own statement page
  * show in-context
  * drill down, showing hierarchy of statements above
* Get statement to stay in place and float above justifications? Or maybe collapse to something 
  smaller, but that lets you see the statement still as you scroll.  maybe combine with header.
* Create statement brilliance:
  * reset state (statement, error) if they navigate away
  * warn if they try and navigate away after entering text
  * When statement already exists, tell them that on the create page and offer link to go there
  * When attempting to create a statement that already exists, redirect them to it with a message that it already exists

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
  
### Error/Requirements
* Do required fields on either justification editor prevent submission?
* When FETCH_STATEMENT_JUSTIFICATIONS_FAILED, no error message on page (didFail is never true)
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
* eslint
  * https://www.npmjs.com/package/eslint-plugin-lodash-fp
* Deploy to S3
  * HTTPS (NGINX?)
  * Cache index.html?
  * cdn.premiser.co?
  * [Invalidation vs. versioning](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)

## Maybe
* https://prerender.io/
* [Resource hints](https://github.com/jantimon/resource-hints-webpack-plugin)
  * [faster](https://hackernoon.com/10-things-i-learned-making-the-fastest-site-in-the-world-18a0e1cdf4a7)
* [selectors](https://github.com/reactjs/reselect) (memoization of deriving from state)
  * http://redux.js.org/docs/recipes/ComputingDerivedData.html
* SSR
  * [Redux SSR](http://redux.js.org/docs/recipes/ServerRendering.html)
* [react-router-redux](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux)?
* Ensure Redux store preserved between hot reloads
  * http://stackoverflow.com/a/34697765/39396
* prop types
* Drag-n-drop
  * [react-dnd](https://github.com/react-dnd/react-dnd)
* [normalizr with immutable](https://github.com/mschipperheyn/normalizr-immutable)?
* Plugins
  * [favicons](https://github.com/jantimon/favicons-webpack-plugin)
  * [Launch browser](https://github.com/1337programming/webpack-browser-plugin)
  * [GraphQL schema hot](https://github.com/nodkz/webpack-plugin-graphql-schema-hot)

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

https://chriszarate.github.io/bookmarkleter/
https://www.labnol.org/internet/better-twitter-bookmarklet/28028/
