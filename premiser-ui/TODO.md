# Howdju UI TODO
* Authentication, messages, logout
* Accept/reject justifications
* Add statements/justifications
* tagging
* Jobs (justification score)
* Search
* Home page tag cloud
* Loading flags (vs. just empty return from API)
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
* Move to API

## Cool
* Collaborative editor: https://github.com/philholden/redux-swarmlog