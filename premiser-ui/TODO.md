# Howdju UI TODO
## MVP
* create justifications
* Delete justifications

* bookmarklet

* tagging
* Jobs (justification score)
* Search
* Home page tag cloud
* favicon


* flag rehydrate after a timeout (sometimes rehydrate not flagged and API calls hang)

* Rotate placeholder of mainSearch to be popular statements: howdju know that "blah blah blah"
* Error reporting
  * feedback script; 
  * unhandled error reporting

* Bug
  * Sometimes verification becomes unresponsive UNTIL you open the nav drawer...

* UX
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
  * Justification awesomeness
    * have "create a justification" instead of "no justifications" on statement page
* Theme/colors
* CSS
  * React-MD recommends: https://github.com/postcss/autoprefixer
  * dppx
  * [vw/vh](https://www.w3.org/TR/css3-values/#viewport-relative-lengths)
  * https://github.com/jgranstrom/sass-extract-loader
  * reset.css alternative? https://necolas.github.io/normalize.css/
* Tap events
  * https://github.com/zilverline/react-tap-event-plugin
    * [Maybe not necessary?](https://www.reddit.com/r/reactjs/comments/4pe61k/why_do_we_need_reacttapeventplugin_in_our_projects/)

* UI Build
  * ensure that CSS goes to external sheet
  * ensure that google fonts go to external link?
* [Form validation](http://redux-form.com/6.6.2/)
  * https://github.com/christianalfoni/formsy-react
  * https://github.com/vazco/uniforms
  * https://www.npmjs.com/package/react-validation
  * http://redux-form.com/

* Why do I have PostCSS in my project?
## 0.2
* Change email, password, password reset
* Timeout authentication
* Loading flags (vs. just empty return from API)
* Statement example: height of the capitol building limit DC

##
 * https://github.com/mattkrick/redux-optimistic-ui
* Time travel to see what libraries made app large
  * Figure out how to minimize lodash import
* favicon
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